import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from src.config import config

def fetch_stock_data(symbol: str, period: str = "5y") -> pd.DataFrame:
    try:
        ticker = yf.Ticker(symbol)
        if period in ['1d', '5d']:
            df = ticker.history(period=period, interval="5m")
        else:
            df = ticker.history(period=period)
    except Exception as e:
        print(f"yfinance error fetching history for {symbol}: {e}")
        return pd.DataFrame()
    
    if df.empty:
        return pd.DataFrame()
        
    df = df.dropna(subset=['Close', 'Open', 'High', 'Low', 'Volume'])
    df = df.sort_index(ascending=True)
    return df

def fetch_market_context(symbol: str, target_index: pd.DatetimeIndex, period: str = "5y") -> pd.DataFrame:
    """
    Fetches broad index, sector index, VIX, and FX data mapped to the symbol in config.yaml.
    Aligns the data to the target_index of the primary stock to handle differing market holidays.
    Uses forward-fill for missing context data on valid trading days of the main stock.
    """
    context_config = config.get('market_context', {}).get(symbol, {})
    if not context_config:
        return pd.DataFrame(index=target_index)
        
    context_dfs = []
    for key, context_symbol in context_config.items():
        if not context_symbol:
            continue
        try:
            ticker = yf.Ticker(context_symbol)
            if period in ['1d', '5d']:
                df = ticker.history(period=period, interval="5m")
            else:
                df = ticker.history(period=period)
            
            if not df.empty:
                # We only need the Close price for context
                df = df[['Close']].rename(columns={'Close': f'Context_{key.upper()}'})
                
                # Strip timezone if necessary for alignment, or ensure both are timezone aware
                # Drop time and timezone for robust daily alignment
                df.index = pd.to_datetime(df.index).normalize().tz_localize(None)
                    
                context_dfs.append(df)
        except Exception as e:
            print(f"yfinance error fetching context {context_symbol} for {symbol}: {e}")
            
    if not context_dfs:
        return pd.DataFrame(index=target_index)
        
    # Merge all context dataframes
    merged_context = pd.concat(context_dfs, axis=1)
    
    # Reindex to match the primary stock's index exactly.
    # Forward fill handles situations where the stock traded but the context index was on holiday.
    # fill_value=method='ffill' works, but let's reindex and ffill safely.
    
    # Normalize merged_context index
    merged_context.index = pd.to_datetime(merged_context.index).normalize().tz_localize(None)
    
    # Normalize target index for the merge
    normalized_target = pd.to_datetime(target_index).normalize().tz_localize(None)
    aligned_context = merged_context.reindex(normalized_target, method='ffill')
    aligned_context.index = target_index # restore original index

    
    # Any remaining NaNs at the beginning can be back-filled
    aligned_context = aligned_context.bfill()
    
    return aligned_context

def fetch_intraday_data(symbol: str) -> pd.DataFrame:
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
