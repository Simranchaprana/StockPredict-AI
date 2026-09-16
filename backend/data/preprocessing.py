import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def fetch_stock_data(symbol: str, period: str = "5y") -> pd.DataFrame:
    """
    Fetches historical OHLCV data using yfinance.
    Ensures data is strictly chronological.
    """
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)
    except Exception as e:
        print(f"yfinance error fetching history for {symbol}: {e}")
        return pd.DataFrame()
    
    if df.empty:
        return pd.DataFrame()
        
    df = df.dropna(subset=['Close', 'Open', 'High', 'Low', 'Volume'])
    df = df.sort_index(ascending=True)
    return df

def fetch_intraday_data(symbol: str) -> pd.DataFrame:
    """
    Fetches 1-minute tick data for the last 7 days (max allowed by yfinance).
    """
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="7d", interval="1m")
    except Exception as e:
        print(f"yfinance error fetching intraday history for {symbol}: {e}")
        return pd.DataFrame()
    
    if df.empty:
        return pd.DataFrame()
        
    df = df.dropna(subset=['Close', 'Open', 'High', 'Low', 'Volume'])
    df = df.sort_index(ascending=True)
    return df

def get_latest_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="5d")
    except Exception as e:
        print(f"yfinance error fetching latest price for {symbol}: {e}")
        return None
        
    if df.empty:
        return None
    
    latest = df.iloc[-1]
    
    if len(df) >= 2:
        prev_close = df.iloc[-2]['Close']
        change = latest['Close'] - prev_close
        pct_change = (change / prev_close) * 100
    else:
        change = 0
        pct_change = 0
        
    return {
        "symbol": symbol,
        "price": latest['Close'],
        "change": change,
        "pct_change": pct_change,
        "volume": latest['Volume'],
        "date": df.index[-1].strftime('%Y-%m-%d')
    }
