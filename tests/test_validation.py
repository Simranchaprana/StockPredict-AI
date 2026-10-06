import pytest
import pandas as pd
import numpy as np
from src.features.build import prepare_features

def test_no_lookahead_leakage():
    # Create synthetic price data
    np.random.seed(42)
    dates = pd.date_range(start="2020-01-01", periods=100, freq="B")
    prices = 100 * np.exp(np.random.randn(100).cumsum() * 0.01)
    df = pd.DataFrame({
        "Open": prices * 0.99,
        "High": prices * 1.01,
        "Low": prices * 0.98,
        "Close": prices,
        "Volume": np.random.randint(1000, 10000, 100)
    }, index=dates)

    # Compute features on full dataset
    df_full = prepare_features(df.copy())
    
    # Compute features on truncated dataset (up to t=50)
    df_trunc = prepare_features(df.iloc[:50].copy())
    
    # Assert that features at t=49 match exactly (meaning no future data leaked into t=49 calculation)
    # The last row of df_trunc is index 49 (which is the 50th item)
    # Drop target columns as they require future data (Next_Close)
    cols_to_compare = [c for c in df_trunc.columns if c not in ["Next_Close", "Next_Return", "Target"]]
    
    pd.testing.assert_series_equal(
        df_full[cols_to_compare].iloc[49], 
        df_trunc[cols_to_compare].iloc[-1],
        check_names=True
    )

def test_backtest_accounting():
    from sklearn.model_selection import TimeSeriesSplit
    from xgboost import XGBClassifier
    
    np.random.seed(42)
    dates = pd.date_range(start="2020-01-01", periods=50, freq="B")
    
    # Create a predictable series where if today goes up, tomorrow goes down
    prices = [100.0]
    for i in range(49):
        if i % 2 == 0:
            prices.append(prices[-1] * 1.02)
        else:
            prices.append(prices[-1] * 0.98)
            
    df = pd.DataFrame({
        "Open": prices,
        "High": [p*1.01 for p in prices],
        "Low": [p*0.99 for p in prices],
        "Close": prices,
        "Volume": 1000
    }, index=dates)
    
    df_feat = prepare_features(df)
    
    assert "Next_Return" in df_feat.columns
    # Check that Next_Return correctly captures tomorrow's return
    assert np.isclose(df_feat["Next_Return"].iloc[0], (prices[1]/prices[0]) - 1)
