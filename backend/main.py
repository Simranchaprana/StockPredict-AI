from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data.preprocessing import get_latest_price, fetch_stock_data
from ml.features import prepare_features
from ml.predict import predict_next_day, get_model_metrics

app = FastAPI(title="Stock Prediction API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Stock Prediction API is running"}

@app.get("/api/stock/{symbol}")
def get_stock_info(symbol: str):
    data = get_latest_price(symbol)
    if not data:
        raise HTTPException(status_code=404, detail="Stock symbol not found or no data available")
    return data

@app.get("/api/history/{symbol}")
def get_stock_history(symbol: str, period: str = "1y"):
    df = fetch_stock_data(symbol, period=period)
    if df.empty:
        raise HTTPException(status_code=404, detail="No historical data found")
        
    # Convert datetime index to string format for JSON serialization
    df.index = df.index.strftime('%Y-%m-%d')
    df_reset = df.reset_index().rename(columns={'Date': 'date', 'Close': 'close', 'Open': 'open', 'High': 'high', 'Low': 'low', 'Volume': 'volume'})
    
    # Fill nan with None for JSON
    df_reset = df_reset.replace({float('nan'): None})
    
    return df_reset.to_dict(orient="records")

@app.get("/api/indicators/{symbol}")
def get_stock_indicators(symbol: str):
    df = fetch_stock_data(symbol, period="1y")
    if df.empty:
        raise HTTPException(status_code=404, detail="No historical data found")
        
    df = prepare_features(df)
    
    # Get latest values
    latest = df.iloc[-1]
    
    # Handle NaNs in case of missing values
    return {
        "symbol": symbol,
        "SMA_20": latest.get('SMA_20'),
        "SMA_50": latest.get('SMA_50'),
        "SMA_200": latest.get('SMA_200'),
        "EMA_20": latest.get('EMA_20'),
        "EMA_50": latest.get('EMA_50'),
        "RSI": latest.get('RSI'),
        "MACD": latest.get('MACD'),
        "MACD_Signal": latest.get('MACD_Signal'),
        "BB_Upper": latest.get('BB_Upper'),
        "BB_Lower": latest.get('BB_Lower')
    }

@app.get("/api/predict/{symbol}")
def get_prediction(symbol: str):
    try:
        prediction = predict_next_day(symbol)
        if not prediction:
            raise HTTPException(status_code=404, detail="Could not generate prediction")
        if "error" in prediction:
            raise HTTPException(status_code=400, detail=prediction["error"])
        return prediction
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Model not trained yet")

@app.get("/api/performance")
def get_performance():
    metrics = get_model_metrics()
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found. Train the model first.")
    return metrics
