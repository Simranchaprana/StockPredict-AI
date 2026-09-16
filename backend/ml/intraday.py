import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.preprocessing import fetch_intraday_data
from ml.features import prepare_features, FEATURE_COLS

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

def resample_ohlcv(df: pd.DataFrame, freq: str) -> pd.DataFrame:
    """Resample 1-min data to specified frequency (e.g. '5min', '8min', '10min')."""
    if df.empty:
        return df
    
    resampled = df.resample(freq).agg({
        'Open': 'first',
        'High': 'max',
        'Low': 'min',
        'Close': 'last',
        'Volume': 'sum'
    }).dropna()
    
    return resampled

def train_and_predict_intraday(symbol: str, intervals=["5min", "8min", "10min"]):
    """
    Fetches 1m data, resamples, trains models dynamically (scalping), 
    and predicts the very next candle for each interval.
    """
    # 1. Fetch 1m data (up to 7 days)
    df_1m = fetch_intraday_data(symbol)
    if df_1m.empty:
        return {"error": f"No intraday 1m data found for {symbol}."}
        
    predictions = {}
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    for interval in intervals:
        df_resampled = resample_ohlcv(df_1m, interval)
        if len(df_resampled) < 200:
            predictions[interval] = {"error": "Not enough data"}
            continue
            
        # 2. Add features
        df_features = prepare_features(df_resampled)
        train_df = df_features.dropna(subset=FEATURE_COLS + ['Target']).copy()
        
        if len(train_df) < 50:
            predictions[interval] = {"error": "Not enough training rows"}
            continue
            
        X_train = train_df[FEATURE_COLS]
        y_train = train_df['Target']
        
        # 3. Train a lightweight RF classifier
        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )
        clf.fit(X_train, y_train)
        
        # Save model (optional, but good for consistency)
        model_path = os.path.join(MODEL_DIR, f"rf_intraday_{interval}_{symbol}.pkl")
        joblib.dump(clf, model_path)
        
        # 4. Predict the next candle
        latest_features = df_features[FEATURE_COLS].iloc[[-1]]
        if latest_features.isnull().values.any():
            predictions[interval] = {"error": "NaN in latest features"}
            continue
            
        pred_class = clf.predict(latest_features)[0]
        confidence = clf.predict_proba(latest_features)[0][pred_class]
        direction = "UP" if pred_class == 1 else "DOWN"
        
        # Target time (the next candle)
        latest_time = latest_features.index[-1]
        minutes_to_add = int(interval.replace('min', ''))
        target_time = latest_time + pd.Timedelta(minutes=minutes_to_add)
        
        predictions[interval] = {
            "prediction": direction,
            "confidence": round(confidence, 2),
            "target_time": target_time.strftime('%H:%M'),
            "latest_time": latest_time.strftime('%H:%M')
        }
        
    return predictions
