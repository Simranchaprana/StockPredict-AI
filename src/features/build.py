import pandas as pd
import numpy as np

def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes technical indicators for a given OHLCV DataFrame.
    """
    if len(df) == 0:
        return df

    df = df.copy()

    # Daily return and multi-horizon returns
    df['Daily_Return'] = df['Close'].pct_change()
    for window in [3, 5, 10, 20]:
        df[f'Return_{window}d'] = df['Close'].pct_change(periods=window)

    # Multi-window volatility
    for window in [5, 10, 20]:
        df[f'Volatility_{window}d'] = df['Daily_Return'].rolling(window=window).std()

    # SMA Ratios
    for window in [20, 50, 200]:
        df[f'SMA_{window}'] = df['Close'].rolling(window=window).mean()
        df[f'SMA_{window}_Ratio'] = df['Close'] / df[f'SMA_{window}']

    # EMA Ratios
    for window in [20, 50]:
        df[f'EMA_{window}'] = df['Close'].ewm(span=window, adjust=False).mean()
        df[f'EMA_{window}_Ratio'] = df['Close'] / df[f'EMA_{window}']

    # RSI (14-day)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # MACD (12, 26, 9)
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = (exp1 - exp2) / df['Close']
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()

    # Bollinger Bands Ratios
    df['BB_Mid'] = df['SMA_20']
    df['BB_Std'] = df['Close'].rolling(window=20).std()
    df['BB_Upper'] = df['BB_Mid'] + (df['BB_Std'] * 2)
    df['BB_Lower'] = df['BB_Mid'] - (df['BB_Std'] * 2)
    df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['BB_Mid']
    df['BB_Position'] = (df['Close'] - df['BB_Lower']) / (df['BB_Upper'] - df['BB_Lower'])

    # Momentum Pct
    df['Momentum_Pct'] = df['Close'] / df['Close'].shift(10) - 1

    # High-Low Spread Pct
    df['High_Low_Spread'] = df['High'] - df['Low']
    df['High_Low_Spread_Pct'] = df['High_Low_Spread'] / df['Close']

    # ATR (Average True Range) - 14 day
    tr1 = df['High'] - df['Low']
    tr2 = (df['High'] - df['Close'].shift(1)).abs()
    tr3 = (df['Low'] - df['Close'].shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    df['ATR_14'] = tr.rolling(window=14).mean()
    df['ATR_14_Ratio'] = df['ATR_14'] / df['Close']

    # ADX (Average Directional Index) - 14 day
    up_move = df['High'] - df['High'].shift(1)
    down_move = df['Low'].shift(1) - df['Low']
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
    plus_di = 100 * (pd.Series(plus_dm, index=df.index).rolling(window=14).mean() / df['ATR_14'])
    minus_di = 100 * (pd.Series(minus_dm, index=df.index).rolling(window=14).mean() / df['ATR_14'])
    df['ADX_14'] = (abs(plus_di - minus_di) / (plus_di + minus_di)) * 100
    df['ADX_14'] = df['ADX_14'].rolling(window=14).mean()

    # OBV (On-Balance Volume)
    direction = np.sign(df['Close'].diff())
    direction = direction.fillna(0)
    df['OBV'] = (df['Volume'] * direction).cumsum()
    df['OBV_Pct_Change'] = df['OBV'].pct_change() # Stationary

    # Stochastic Oscillator (14 day)
    low_14 = df['Low'].rolling(window=14).min()
    high_14 = df['High'].rolling(window=14).max()
    df['Stoch_K'] = 100 * ((df['Close'] - low_14) / (high_14 - low_14))
    df['Stoch_D'] = df['Stoch_K'].rolling(window=3).mean()

    # CCI (Commodity Channel Index) - 20 day
    tp = (df['High'] + df['Low'] + df['Close']) / 3
    sma_tp = tp.rolling(window=20).mean()
    mean_dev = tp.rolling(window=20).apply(lambda x: np.mean(np.abs(x - x.mean())))
    df['CCI_20'] = (tp - sma_tp) / (0.015 * mean_dev)

    # Williams %R - 14 day
    df['Williams_R'] = (high_14 - df['Close']) / (high_14 - low_14) * -100

    # ROC (Rate of Change) - 14 day
    df['ROC_14'] = df['Close'].pct_change(periods=14) * 100

    # VWAP (Volume Weighted Average Price)
    df['Cumulative_Volume'] = df['Volume'].cumsum()
    df['Cumulative_Price_Volume'] = (df['Close'] * df['Volume']).cumsum()
    df['VWAP'] = df['Cumulative_Price_Volume'] / df['Cumulative_Volume']
    df['VWAP_Ratio'] = df['Close'] / df['VWAP']

    # Volume change & Price-Volume divergence
    df['Volume_Change'] = df['Volume'].pct_change()
    df['Price_Volume_Divergence'] = np.where(
        (df['Daily_Return'] > 0) & (df['Volume_Change'] < 0), -1,
        np.where((df['Daily_Return'] < 0) & (df['Volume_Change'] > 0), 1, 0)
    )

    # Market Context Features (if available)
    if 'Context_BROAD_INDEX' in df.columns:
        df['Broad_Index_Return'] = df['Context_BROAD_INDEX'].pct_change()
        df['Relative_Broad_Return'] = df['Daily_Return'] - df['Broad_Index_Return']
    if 'Context_SECTOR_INDEX' in df.columns:
        df['Sector_Index_Return'] = df['Context_SECTOR_INDEX'].pct_change()
        df['Relative_Sector_Return'] = df['Daily_Return'] - df['Sector_Index_Return']
    if 'Context_VIX' in df.columns:
        df['VIX_Close'] = df['Context_VIX']
        df['VIX_Change'] = df['Context_VIX'].pct_change()
    if 'Context_FX' in df.columns:
        df['FX_Return'] = df['Context_FX'].pct_change()

    return df

def generate_target(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates target variable (1 if next day close > today close, else 0).
    """
    df = df.copy()
    # Next day's close
    df['Next_Close'] = df['Close'].shift(-1)
    df['Next_Return'] = df['Next_Close'] / df['Close'] - 1
    df['Target'] = (df['Next_Close'] > df['Close']).astype(int)
    
    # The last row will not have a valid Next_Close/Target
    return df

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    df = compute_indicators(df)
    df = generate_target(df)
    return df

FEATURE_COLS = [
    'Daily_Return', 'Return_3d', 'Return_5d', 'Return_10d', 'Return_20d',
    'Volatility_5d', 'Volatility_10d', 'Volatility_20d',
    'SMA_20_Ratio', 'SMA_50_Ratio', 'SMA_200_Ratio', 
    'EMA_20_Ratio', 'EMA_50_Ratio', 'RSI', 'MACD', 'MACD_Signal', 
    'BB_Width', 'BB_Position', 'Momentum_Pct', 'High_Low_Spread_Pct',
    'ATR_14_Ratio', 'ADX_14', 'OBV_Pct_Change', 'Stoch_K', 'Stoch_D',
    'CCI_20', 'Williams_R', 'ROC_14', 'VWAP_Ratio', 'Volume_Change',
    'Price_Volume_Divergence'
]

CONTEXT_COLS = [
    'Broad_Index_Return', 'Relative_Broad_Return',
    'Sector_Index_Return', 'Relative_Sector_Return',
    'VIX_Close', 'VIX_Change', 'FX_Return',
    'Sentiment_Score'
]
FEATURE_COLS.extend(CONTEXT_COLS)
