import os
import joblib
import pandas as pd
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.preprocessing import fetch_stock_data
from ml.features import prepare_features, FEATURE_COLS

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest.pkl")

def predict_next_day(symbol: str):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model not found. Please train the model first.")
        
    model = joblib.load(MODEL_PATH)
    
    # We only need enough history to calculate rolling features (200 days for SMA_200)
    df = fetch_stock_data(symbol, period="1y")
    if df.empty:
        return None
        
    df = prepare_features(df)
    
    # The last row represents today's data, predicting tomorrow.
    # Target and Next_Close will be NaN for this row, which is expected.
    latest_features = df[FEATURE_COLS].iloc[-1:]
    
    if latest_features.isnull().values.any():
        # Maybe the stock doesn't have 200 days of history
        return {"error": "Not enough historical data to compute technical indicators."}
        
    prediction = model.predict(latest_features)[0]
    probabilities = model.predict_proba(latest_features)[0]
    
    confidence = probabilities[prediction]
    
    direction = "UP" if prediction == 1 else "DOWN"
    
    # A simple linear approximation for price prediction (optional based on direction)
    latest_price = df['Close'].iloc[-1]
    volatility = df['Volatility'].iloc[-1]
    
    # Basic estimate: +/- volatility
    price_change_est = latest_price * volatility
    predicted_price = latest_price + price_change_est if direction == "UP" else latest_price - price_change_est
    
    return {
        "symbol": symbol,
        "prediction": direction,
        "predicted_price": round(predicted_price, 2),
        "confidence": round(confidence, 2),
        "model": "Random Forest"
    }
    
def get_model_metrics():
    metrics_path = os.path.join(MODEL_DIR, "metrics.joblib")
    if os.path.exists(metrics_path):
        return joblib.load(metrics_path)
    return None
