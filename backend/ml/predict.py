import os
import joblib
import pandas as pd
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.preprocessing import fetch_stock_data
from ml.features import prepare_features, FEATURE_COLS
from ml.train import train_models

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

def predict_next_day(symbol: str):
    classifier_path = os.path.join(MODEL_DIR, f"rf_classifier_{symbol}.pkl")
    regressor_path = os.path.join(MODEL_DIR, f"rf_regressor_{symbol}.pkl")
    
    # Auto-train if models for this symbol don't exist
    if not os.path.exists(classifier_path) or not os.path.exists(regressor_path):
        try:
            train_models(symbol)
        except Exception as e:
            return {"error": f"Failed to train model for {symbol}: {str(e)}"}
            
    classifier = joblib.load(classifier_path)
    regressor = joblib.load(regressor_path)
    
    df = fetch_stock_data(symbol, period="1y")
    if df.empty:
        return {"error": f"No data found for {symbol}"}
        
    df = prepare_features(df)
    
    # Helper to generate prediction for a specific row
    def generate_prediction_for_row(row_idx):
        features = df[FEATURE_COLS].iloc[row_idx:row_idx+1]
        
        if features.isnull().values.any():
            return None
            
        pred_class = classifier.predict(features)[0]
        probabilities = classifier.predict_proba(features)[0]
        confidence = probabilities[pred_class]
        direction = "UP" if pred_class == 1 else "DOWN"
        
        predicted_return = regressor.predict(features)[0]
        current_price = df['Close'].iloc[row_idx]
        predicted_price = current_price * (1 + predicted_return)
        
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
            "confidence": round(confidence, 2),
            "model": "Random Forest ML",
            "latest_data_date": date_str,
            "target_date": target_date_str,
            "models_agree": models_agree,
            "warning": warning
        }

    next_day_prediction = generate_prediction_for_row(-1)
    
    # Intraday / Today prediction (using yesterday's data to predict today)
    today_prediction = None
    if len(df) >= 2:
        today_prediction = generate_prediction_for_row(-2)

    return {
        "next_day_prediction": next_day_prediction,
        "today_prediction": today_prediction
    }
    
def get_model_metrics(symbol: str):
    metrics_path = os.path.join(MODEL_DIR, f"metrics_{symbol}.joblib")
    if os.path.exists(metrics_path):
        return joblib.load(metrics_path)
    return None
