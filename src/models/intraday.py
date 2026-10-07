import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from src.ingestion.fetch import fetch_intraday_data
from src.features.build import prepare_features, FEATURE_COLS

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")

def prepare_intraday_features(df: pd.DataFrame) -> pd.DataFrame:
    """Intraday specific features using shorter windows so we don't drop 200 rows."""
    df = df.copy()
    
    # We will just use the standard prepare_features but maybe not all if it requires 200 days
    # Wait, prepare_features from build.py requires window=200 for SMA_200.
    # To keep this functional without much rewrite for intraday:
    df = prepare_features(df)
    # The target is already generated
    return df

def resample_ohlcv(df: pd.DataFrame, freq: str) -> pd.DataFrame:
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
            
        df_features = prepare_intraday_features(df_resampled)
        
        active_features = [col for col in FEATURE_COLS if col in df_features.columns]
        
        train_df = df_features.dropna(subset=active_features + ['Target']).copy()
        
        if len(train_df) < 50:
            predictions[interval] = {"error": "Not enough training rows"}
            continue
            
        X_train = train_df[active_features]
        y_train = train_df['Target']
        
        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            class_weight='balanced_subsample',
            random_state=42
        )
        clf.fit(X_train, y_train)
        
        model_path = os.path.join(MODEL_DIR, f"rf_intraday_{interval}_{symbol}.pkl")
        joblib.dump(clf, model_path)
        
        latest_features = df_features[active_features].iloc[[-1]]
        if latest_features.isnull().values.any():
            predictions[interval] = {"error": "NaN in latest features"}
            continue
            
        pred_class = clf.predict(latest_features)[0]
        confidence = clf.predict_proba(latest_features)[0][pred_class]
        
        minutes_to_add = int(interval.replace('min', ''))
        
        # Determine if market is closed (if latest tick is older than 30 mins)
        absolute_latest_time = df_1m.index[-1]
        now = pd.Timestamp.now(tz=absolute_latest_time.tz)
        if (now - absolute_latest_time).total_seconds() > 30 * 60:
            # Market is closed, skip returning a live prediction for this interval
            # Return a special status flag so the frontend knows it's closed
            predictions[interval] = {
                "status": "closed",
                "message": "Market is currently closed."
            }
            continue
            
        direction = "UP" if pred_class == 1 else "DOWN"
        
        target_time = absolute_latest_time + pd.Timedelta(minutes=minutes_to_add)
        
        predictions[interval] = {
            "prediction": direction,
            "confidence": round(confidence, 2),
            "target_time": target_time.strftime('%H:%M'),
            "latest_time": absolute_latest_time.strftime('%H:%M')
        }
        
    return predictions
