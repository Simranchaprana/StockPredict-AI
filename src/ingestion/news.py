import yfinance as yf
import pandas as pd
import os
from datetime import datetime

def fetch_live_news(symbol: str) -> list[str]:
    """
    Fetches the latest news headlines for the given symbol using yfinance.
    Returns a list of headline strings.
    """
    try:
        ticker = yf.Ticker(symbol)
        news_items = ticker.news
        if not news_items:
            return []
            
        headlines = []
        for item in news_items:
            # yfinance news schema sometimes changes, try to safely get title/summary
            title = item.get('title', '')
            summary = item.get('summary', '')
            # Combine title and summary for richer context if summary exists
            text = f"{title}. {summary}".strip()
            if text and text != ".":
                headlines.append(text)
        return headlines
    except Exception as e:
        print(f"yfinance error fetching news for {symbol}: {e}")
        return []

def fetch_historical_sentiment(symbol: str, target_index: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Fetches historical sentiment.
    Since historical daily news over 5 years requires a paid API (e.g. Finnhub, Polygon),
    this acts as a placeholder that returns exactly 0.0 for all days to maintain pipeline integrity,
    UNLESS a local CSV override exists at data/raw/sentiment_{symbol}.csv.
    """
    csv_path = f"data/raw/sentiment_{symbol}.csv"
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path, parse_dates=['Date'], index_col='Date')
            # Ensure the CSV has a 'Sentiment_Score' column
            if 'Sentiment_Score' in df.columns:
                df.index = df.index.normalize().tz_localize(None)
                normalized_target = pd.to_datetime(target_index).normalize().tz_localize(None)
                
                aligned = df.reindex(normalized_target, fill_value=0.0)
                aligned.index = target_index
                return aligned[['Sentiment_Score']]
        except Exception as e:
            print(f"Error loading custom sentiment CSV for {symbol}: {e}")
            
    # Fallback to zero explicitly
    df = pd.DataFrame(index=target_index, data={"Sentiment_Score": 0.0})
    return df
