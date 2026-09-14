import pandas as pd
import numpy as np

def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes technical indicators for a given OHLCV DataFrame.
    """
    if len(df) == 0:
        return df

    df = df.copy()

    # Daily return
    df['Daily_Return'] = df['Close'].pct_change()

    # SMA
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    df['SMA_200'] = df['Close'].rolling(window=200).mean()

    # EMA
    df['EMA_20'] = df['Close'].ewm(span=20, adjust=False).mean()
    df['EMA_50'] = df['Close'].ewm(span=50, adjust=False).mean()

    # RSI (14-day)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # MACD (12, 26, 9)
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()

    # Bollinger Bands (20-day, 2 std)
    df['BB_Mid'] = df['SMA_20']
    df['BB_Std'] = df['Close'].rolling(window=20).std()
    df['BB_Upper'] = df['BB_Mid'] + (df['BB_Std'] * 2)
    df['BB_Lower'] = df['BB_Mid'] - (df['BB_Std'] * 2)

    # Rolling Volatility (20-day std of returns)
    df['Volatility'] = df['Daily_Return'].rolling(window=20).std()

    # Momentum (10-day)
    df['Momentum'] = df['Close'] - df['Close'].shift(10)

    # High-Low Spread
    df['High_Low_Spread'] = df['High'] - df['Low']

    return df

def generate_target(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates target variable (1 if next day close > today close, else 0).
    """
    df = df.copy()
    # Next day's close
    df['Next_Close'] = df['Close'].shift(-1)
    df['Target'] = (df['Next_Close'] > df['Close']).astype(int)
    
    # The last row will not have a valid Next_Close/Target, we should leave it or drop it in training
    return df

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    df = compute_indicators(df)
    df = generate_target(df)
    # Drop rows with NaNs from rolling windows (except the last row's Next_Close which is expected for prediction)
    return df

FEATURE_COLS = [
    'Daily_Return', 'SMA_20', 'SMA_50', 'SMA_200', 'EMA_20', 'EMA_50',
    'RSI', 'MACD', 'MACD_Signal', 'BB_Mid', 'BB_Std', 'BB_Upper', 'BB_Lower',
    'Volatility', 'Momentum', 'High_Low_Spread'
]
