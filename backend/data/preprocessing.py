import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def fetch_stock_data(symbol: str, period: str = "5y") -> pd.DataFrame:
    """
    Fetches historical OHLCV data using yfinance.
    Ensures data is strictly chronological.
    """
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    
    if df.empty:
        return pd.DataFrame()
        
    # Reset index to make Date a column instead of an index (helps with JSON serialization later if needed)
    # But keep index as datetime for now for technical indicator rolling operations.
    
    # Drop any non-trading rows where NA
    df = df.dropna(subset=['Close', 'Open', 'High', 'Low', 'Volume'])
    
    # Sort strictly by date ascending (chronological)
    df = df.sort_index(ascending=True)
    
    # Optional: adjust for stock splits/dividends if needed. yfinance 'history' adjusts automatically.
    
    return df

def get_latest_price(symbol: str):
    ticker = yf.Ticker(symbol)
    # Use 5d to guarantee we get the latest trading day even on weekends/holidays
    df = ticker.history(period="5d")
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
        "volume": latest['Volume']
    }
