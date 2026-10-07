import os
import joblib
import pandas as pd
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.ingestion.fetch import fetch_stock_data, fetch_market_context
from src.ingestion.news import fetch_live_news, fetch_historical_sentiment
from src.sentiment.score import SentimentScorer
from src.features.build import prepare_features, FEATURE_COLS
from src.validation.walk_forward import train_models

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "saved_models")

def predict_next_day(symbol: str):
    classifier_path = os.path.join(MODEL_DIR, f"xgb_classifier_{symbol}.pkl")
    regressor_path = os.path.join(MODEL_DIR, f"rf_regressor_{symbol}.pkl")
    
    # Auto-train is now handled asynchronously by main.py
    if not os.path.exists(classifier_path) or not os.path.exists(regressor_path):
        return {"error": f"Model not trained yet for {symbol}. It should be training in the background."}
            
    classifier = joblib.load(classifier_path)
    regressor = joblib.load(regressor_path)
    
    df = fetch_stock_data(symbol, period="1y")
    if df.empty:
        return {"error": f"No data found for {symbol}"}
        
    context_df = fetch_market_context(symbol, df.index, period="1y")
    if not context_df.empty:
        df = pd.concat([df, context_df], axis=1)
        
    sentiment_df = fetch_historical_sentiment(symbol, df.index)
    if not sentiment_df.empty:
        df = pd.concat([df, sentiment_df], axis=1)
        
    # Fetch live sentiment for the most recent prediction
    scorer = SentimentScorer()
    live_news = fetch_live_news(symbol)
    live_sentiment = scorer.aggregate_daily_sentiment(live_news)
    df.loc[df.index[-1], 'Sentiment_Score'] = live_sentiment
        
    df = prepare_features(df)
    
    active_features = [col for col in FEATURE_COLS if col in df.columns]
    
    def generate_prediction_for_row(row_idx):
        features = df[active_features].iloc[[row_idx]]
        
        if features.isnull().values.any():
            return None
            
        pred_class = classifier.predict(features)[0]
        probabilities = classifier.predict_proba(features)[0]
        
        prob_up = probabilities[1]
        if prob_up >= 0.65:
            direction = "BUY"
            confidence = prob_up
        elif prob_up <= 0.35:
            direction = "SELL"
            confidence = probabilities[0]
        else:
            direction = "HOLD"
            confidence = max(prob_up, probabilities[0])
        
        predicted_return = regressor.predict(features)[0]
        current_price = df['Close'].iloc[row_idx]
        predicted_price = current_price * (1 + predicted_return)
        
        # Conformal Prediction Bounds (90% Confidence Interval)
        conformal_path = os.path.join(MODEL_DIR, f"conformal_q90_{symbol}.pkl")
        conformal_q90 = joblib.load(conformal_path) if os.path.exists(conformal_path) else 0.0
        conformal_lower = predicted_price - conformal_q90
        conformal_upper = predicted_price + conformal_q90
        
        date_dt = features.index[0]
        date_str = date_dt.strftime('%Y-%m-%d')
        days_to_add = 3 if date_dt.weekday() == 4 else 1
        target_date_str = (date_dt + pd.Timedelta(days=days_to_add)).strftime('%Y-%m-%d')

        price_implied_direction = "UP" if predicted_price > current_price else "DOWN"
        models_agree = (direction == price_implied_direction)
        
        warning = None
        if not models_agree:
            warning = f"Classifier predicts {direction} but Regressor price target (₹{predicted_price:.2f}) implies {price_implied_direction}. Treat with caution."

        return {
            "symbol": symbol,
            "prediction": direction,
            "predicted_price": round(predicted_price, 2),
            "conformal_lower": round(conformal_lower, 2),
            "conformal_upper": round(conformal_upper, 2),
            "confidence": round(confidence, 2),
            "model": "XGBoost ML",
            "latest_data_date": date_str,
            "target_date": target_date_str,
            "models_agree": models_agree,
            "warning": warning
        }

    next_day_prediction = generate_prediction_for_row(-1)
    
    today_prediction = None
    if len(df) >= 2:
        today_prediction = generate_prediction_for_row(-2)

    importances_dict = {}
    shap_values_dict = {}
    
    base_clf = classifier
    if hasattr(classifier, 'calibrated_classifiers_'):
        base_clf = classifier.calibrated_classifiers_[0].estimator

    if hasattr(base_clf, 'feature_importances_'):
        importances = base_clf.feature_importances_
        sorted_idx = importances.argsort()[::-1][:10]
        importances_dict = {active_features[i]: round(float(importances[i]), 4) for i in sorted_idx}
        
        # Calculate SHAP for the most recent prediction
        try:
            import shap
            explainer = shap.TreeExplainer(base_clf)
            shap_vals = explainer.shap_values(df[active_features].iloc[[-1]])
            
            # For binary classification, shap_values might be a list (one for each class)
            # or a single array (for the positive class). XGBoost usually returns single array.
            if isinstance(shap_vals, list):
                sv = shap_vals[1][0]
            else:
                sv = shap_vals[0]
                
            # Get top 5 positive drivers and top 5 negative drivers
            feature_impacts = [(active_features[i], float(sv[i])) for i in range(len(active_features))]
            feature_impacts.sort(key=lambda x: x[1], reverse=True)
            
            shap_values_dict = {
                "positive_drivers": [{"feature": k, "impact": round(v, 4)} for k, v in feature_impacts if v > 0][:5],
                "negative_drivers": [{"feature": k, "impact": round(v, 4)} for k, v in feature_impacts if v < 0][-5:]
            }
        except Exception as e:
            print(f"SHAP calculation error: {e}")

    return {
        "next_day_prediction": next_day_prediction,
        "today_prediction": today_prediction,
        "feature_importances": importances_dict,
        "shap_values": shap_values_dict
    }
    
def get_model_metrics(symbol: str):
    metrics_path = os.path.join(MODEL_DIR, f"metrics_{symbol}.joblib")
    if os.path.exists(metrics_path):
        return joblib.load(metrics_path)
    return None
