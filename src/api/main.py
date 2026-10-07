from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.ingestion.fetch import get_latest_price, fetch_stock_data
from src.features.build import prepare_features
from src.api.predict import predict_next_day, get_model_metrics
from src.models.intraday import train_and_predict_intraday
from src.api.database import models
from src.api.database.database import engine, SessionLocal
from fastapi import Depends, Path, Request
from sqlalchemy.orm import Session
from src.api.auth import router as auth_router

# Fix database db path since it might try to create it in the old location
models.Base.metadata.create_all(bind=engine)

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Stock Prediction API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@limiter.limit("60/minute")
def read_root(request: Request):
    return {"status": "ok", "message": "Stock Prediction API is running"}

@app.get("/api/stock/{symbol}")
@limiter.limit("20/minute")
def get_stock_info(request: Request, symbol: str = Path(..., pattern=r"^[A-Za-z0-9.\-^=]{1,15}$")):
    data = get_latest_price(symbol)
    if not data:
        raise HTTPException(status_code=404, detail="Stock symbol not found or no data available")
    return data

@app.get("/api/history/{symbol}")
@limiter.limit("20/minute")
def get_stock_history(request: Request, symbol: str, period: str = "1y"):
    df = fetch_stock_data(symbol, period=period)
    if df.empty:
        raise HTTPException(status_code=404, detail="No historical data found")
        
    df.index = df.index.strftime('%Y-%m-%d %H:%M:%S')
    df_reset = df.reset_index().rename(columns={
        'Date': 'date', 
        'Datetime': 'date',
        'Close': 'close', 
        'Open': 'open', 
        'High': 'high', 
        'Low': 'low', 
        'Volume': 'volume'
    })
    
    df_reset = df_reset.replace({float('nan'): None})
    return df_reset.to_dict(orient="records")

@app.get("/api/indicators/{symbol}")
@limiter.limit("20/minute")
def get_stock_indicators(request: Request, symbol: str):
    df = fetch_stock_data(symbol, period="1y")
    if df.empty:
        raise HTTPException(status_code=404, detail="No historical data found")
        
    from src.ingestion.fetch import fetch_market_context
    import pandas as pd
    
    context_df = fetch_market_context(symbol, df.index, period="1y")
    if not context_df.empty:
        df = pd.concat([df, context_df], axis=1)
        
    from src.ingestion.news import fetch_live_news
    from src.sentiment.score import SentimentScorer
    
    # Live Sentiment
    scorer = SentimentScorer()
    live_news = fetch_live_news(symbol)
    live_sentiment = scorer.aggregate_daily_sentiment(live_news)
    df.loc[df.index[-1], 'Sentiment_Score'] = live_sentiment
        
    df = prepare_features(df)
    latest = df.iloc[-1]
    
    def get_safe(col):
        val = latest.get(col)
        return None if pd.isna(val) else val
        
    return {
        "symbol": symbol,
        "SMA_20": get_safe('SMA_20'),
        "SMA_50": get_safe('SMA_50'),
        "SMA_200": get_safe('SMA_200'),
        "EMA_20": get_safe('EMA_20'),
        "EMA_50": get_safe('EMA_50'),
        "RSI": get_safe('RSI'),
        "MACD": get_safe('MACD'),
        "MACD_Signal": get_safe('MACD_Signal'),
        "BB_Upper": get_safe('BB_Upper'),
        "BB_Lower": get_safe('BB_Lower'),
        "ATR_14": get_safe('ATR_14'),
        "ADX_14": get_safe('ADX_14'),
        "Williams_R": get_safe('Williams_R'),
        "CCI_20": get_safe('CCI_20'),
        "VWAP": get_safe('VWAP'),
        "Broad_Index_Return": get_safe('Broad_Index_Return'),
        "Sector_Index_Return": get_safe('Sector_Index_Return'),
        "VIX_Close": get_safe('VIX_Close'),
        "FX_Return": get_safe('FX_Return'),
        "Sentiment_Score": get_safe('Sentiment_Score')
    }

from fastapi import BackgroundTasks
from fastapi.responses import JSONResponse
import os

@app.get("/api/predict/{symbol}")
@limiter.limit("20/minute") # Increased limit slightly for polling
def get_prediction(request: Request, symbol: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        from src.validation.walk_forward import train_models
        MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "saved_models")
        classifier_path = os.path.join(MODEL_DIR, f"xgb_classifier_{symbol}.pkl")
        
        if not os.path.exists(classifier_path):
            background_tasks.add_task(train_models, symbol)
            return JSONResponse(status_code=202, content={"status": "training", "message": "Model is training in background... Please wait 15-30s."})
            
        prediction_data = predict_next_day(symbol)
        if not prediction_data:
            raise HTTPException(status_code=404, detail="Could not generate prediction")
        if "error" in prediction_data:
            raise HTTPException(status_code=400, detail=prediction_data["error"])
            
        next_day = prediction_data['next_day_prediction']
        
        log_entry = models.PredictionLog(
            symbol=symbol,
            prediction_direction=next_day['prediction'],
            confidence=next_day['confidence'],
            predicted_price=next_day['predicted_price'],
            model=next_day['model']
        )
        db.add(log_entry)
        db.commit()
            
        return prediction_data
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Model not trained yet")

@app.get("/api/predict_intraday/{symbol}")
@limiter.limit("10/minute")
def get_intraday_prediction(request: Request, symbol: str):
    try:
        predictions = train_and_predict_intraday(symbol)
        if "error" in predictions:
            raise HTTPException(status_code=400, detail=predictions["error"])
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/performance/{symbol}")
@limiter.limit("20/minute")
def get_performance(request: Request, symbol: str):
    metrics = get_model_metrics(symbol)
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found. Train the model first.")
    return metrics

@app.get("/api/history_logs/{symbol}")
@limiter.limit("20/minute")
def get_history_logs(request: Request, symbol: str, db: Session = Depends(get_db)):
    logs = db.query(models.PredictionLog).filter(models.PredictionLog.symbol == symbol).order_by(models.PredictionLog.date.desc()).limit(10).all()
    return logs

@app.get("/api/news/{symbol}")
@limiter.limit("20/minute")
def get_news(request: Request, symbol: str):
    from src.ingestion.news import fetch_live_news
    try:
        # Use SPY as a proxy for general market news if symbol is 'market'
        target_symbol = "SPY" if symbol.lower() == "market" else symbol
        import yfinance as yf
        ticker = yf.Ticker(target_symbol)
        news = ticker.news
        if not news:
            return []
        formatted_news = []
        for n in news[:5]: # Return top 5
            formatted_news.append({
                "title": n.get("title", ""),
                "publisher": n.get("publisher", "Yahoo Finance"),
                "link": n.get("link", "#"),
                "time": n.get("providerPublishTime", 0)
            })
        return formatted_news
    except Exception as e:
        return []

@app.get("/api/watchlist")
@limiter.limit("20/minute")
def get_watchlist(request: Request, type: str = "macro"):
    # Fast endpoint just to get latest price and change for global watchlist
    import yfinance as yf
    
    if type == "macro":
        symbols = ['^NSEI', 'SPY', 'GC=F', 'CL=F', 'BTC-USD']
        name_map = {
            '^NSEI': 'NIFTY 50',
            'SPY': 'S&P 500',
            'GC=F': 'Gold',
            'CL=F': 'Crude Oil',
            'BTC-USD': 'Bitcoin'
        }
    else:
        symbols = ['DX-Y.NYB', 'INR=X', 'EURUSD=X', '^TNX', '^VIX']
        name_map = {
            'DX-Y.NYB': 'US Dollar Index',
            'INR=X': 'USD/INR',
            'EURUSD=X': 'EUR/USD',
            '^TNX': 'US 10-Year Yield',
            '^VIX': 'VIX Volatility'
        }
        
    results = []
    try:
        # Use yf.download or ThreadPoolExecutor for speed
        tickers = yf.Tickers(" ".join(symbols))
        for sym in symbols:
            info = tickers.tickers[sym].info
            if 'regularMarketPrice' in info or 'previousClose' in info:
                price = info.get('regularMarketPrice', info.get('currentPrice', 0))
                prev = info.get('previousClose', 0)
                change = price - prev
                pct_change = (change / prev * 100) if prev else 0
                results.append({
                    "symbol": sym,
                    "name": name_map.get(sym, sym),
                    "price": price,
                    "change": change,
                    "pct_change": pct_change,
                    "isUp": change >= 0
                })
    except Exception as e:
        print(f"Watchlist error: {e}")
    return results
