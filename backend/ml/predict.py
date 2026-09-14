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
    
    latest_features = df[FEATURE_COLS].iloc[-1:]
    
    if latest_features.isnull().values.any():
        return {"error": "Not enough historical data to compute technical indicators."}
        
    prediction = classifier.predict(latest_features)[0]
    probabilities = classifier.predict_proba(latest_features)[0]
    confidence = probabilities[prediction]
    
    direction = "UP" if prediction == 1 else "DOWN"
    
    # Use the ML Regressor for price prediction
    predicted_price = regressor.predict(latest_features)[0]
    
    return {
        "symbol": symbol,
        "prediction": direction,
        "predicted_price": round(predicted_price, 2),
        "confidence": round(confidence, 2),
        "model": "Random Forest ML"
    }
    
def get_model_metrics(symbol: str):
    metrics_path = os.path.join(MODEL_DIR, f"metrics_{symbol}.joblib")
    if os.path.exists(metrics_path):
        return joblib.load(metrics_path)
    return None
