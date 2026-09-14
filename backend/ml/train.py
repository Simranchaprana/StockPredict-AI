import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import TimeSeriesSplit

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.preprocessing import fetch_stock_data
from ml.features import prepare_features, FEATURE_COLS

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

def train_models(symbol="RELIANCE.NS"):
    print(f"Fetching data for {symbol}...")
    df = fetch_stock_data(symbol, period="5y")
    df = prepare_features(df)
    
    # Drop rows with NaN in features (due to rolling windows) and drop the last row (no Next_Close)
    train_df = df.dropna(subset=FEATURE_COLS + ['Target', 'Next_Close']).copy()
    
    X = train_df[FEATURE_COLS]
    y = train_df['Target']
    
    tscv = TimeSeriesSplit(n_splits=5)
    
    print("Training Logistic Regression (Baseline)...")
    lr = LogisticRegression(max_iter=1000)
    
    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    
    # Evaluate with TimeSeriesSplit
    lr_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': []}
    rf_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': []}
    
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]
        
        # Logistic Regression
        lr.fit(X_train, y_train)
        lr_preds = lr.predict(X_test)
        lr_probs = lr.predict_proba(X_test)[:, 1]
        
        lr_metrics['acc'].append(accuracy_score(y_test, lr_preds))
        lr_metrics['prec'].append(precision_score(y_test, lr_preds, zero_division=0))
        lr_metrics['rec'].append(recall_score(y_test, lr_preds, zero_division=0))
        lr_metrics['f1'].append(f1_score(y_test, lr_preds, zero_division=0))
        try:
            lr_metrics['roc'].append(roc_auc_score(y_test, lr_probs))
        except ValueError:
            pass
            
        # Random Forest
        rf.fit(X_train, y_train)
        rf_preds = rf.predict(X_test)
        rf_probs = rf.predict_proba(X_test)[:, 1]
        
        rf_metrics['acc'].append(accuracy_score(y_test, rf_preds))
        rf_metrics['prec'].append(precision_score(y_test, rf_preds, zero_division=0))
        rf_metrics['rec'].append(recall_score(y_test, rf_preds, zero_division=0))
        rf_metrics['f1'].append(f1_score(y_test, rf_preds, zero_division=0))
        try:
            rf_metrics['roc'].append(roc_auc_score(y_test, rf_probs))
        except ValueError:
            pass
            
    print("\n--- Model Performance (TimeSeriesSplit CV) ---")
    print("Logistic Regression:")
    print(f"Accuracy:  {np.mean(lr_metrics['acc']):.2%}")
    print(f"Precision: {np.mean(lr_metrics['prec']):.2f}")
    print(f"Recall:    {np.mean(lr_metrics['rec']):.2f}")
    print(f"F1 Score:  {np.mean(lr_metrics['f1']):.2f}")
    
    print("\nRandom Forest:")
    print(f"Accuracy:  {np.mean(rf_metrics['acc']):.2%}")
    print(f"Precision: {np.mean(rf_metrics['prec']):.2f}")
    print(f"Recall:    {np.mean(rf_metrics['rec']):.2f}")
    print(f"F1 Score:  {np.mean(rf_metrics['f1']):.2f}")
    
    # Train final model on all data
    print("\nTraining final Random Forest model on all data...")
    rf.fit(X, y)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, "random_forest.pkl")
    joblib.dump(rf, model_path)
    print(f"Model saved to {model_path}")

    # Backtest simulation
    # Simple strategy: Start with 100,000. Buy if model predicts 1, hold otherwise.
    # We will test on the last split
    last_train_idx, last_test_idx = list(tscv.split(X))[-1]
    X_test_backtest = X.iloc[last_test_idx]
    y_test_backtest_actual_returns = df.iloc[last_test_idx]['Daily_Return']
    
    rf.fit(X.iloc[last_train_idx], y.iloc[last_train_idx])
    signals = rf.predict(X_test_backtest)
    
    initial_capital = 100000
    
    # Buy & Hold Return
    cumulative_market_return = (1 + y_test_backtest_actual_returns).prod()
    buy_and_hold_value = initial_capital * cumulative_market_return
    
    # Strategy Return
    # Only capture returns on days where signal is 1 (we bought the day before)
    # Actually, if signal is 1, it means we predict tomorrow will be up. 
    # So we capture tomorrow's return.
    strategy_returns = y_test_backtest_actual_returns * signals
    cumulative_strategy_return = (1 + strategy_returns).prod()
    strategy_value = initial_capital * cumulative_strategy_return
    
    print("\n--- Backtest (Last fold) ---")
    print(f"Starting Capital: ₹{initial_capital:,}")
    print(f"Buy & Hold:       ₹{buy_and_hold_value:,.2f} ({(cumulative_market_return-1)*100:.1f}%)")
    print(f"Model Strategy:   ₹{strategy_value:,.2f} ({(cumulative_strategy_return-1)*100:.1f}%)")
    
    metrics = {
        "Random Forest": {
            "accuracy": np.mean(rf_metrics['acc']),
            "precision": np.mean(rf_metrics['prec']),
            "recall": np.mean(rf_metrics['rec']),
            "f1": np.mean(rf_metrics['f1']),
        },
        "Logistic Regression": {
            "accuracy": np.mean(lr_metrics['acc']),
            "precision": np.mean(lr_metrics['prec']),
            "recall": np.mean(lr_metrics['rec']),
            "f1": np.mean(lr_metrics['f1']),
        },
        "Backtest": {
            "buy_and_hold_return": (cumulative_market_return-1)*100,
            "strategy_return": (cumulative_strategy_return-1)*100
        }
    }
    
    metrics_path = os.path.join(MODEL_DIR, "metrics.joblib")
    joblib.dump(metrics, metrics_path)
    
if __name__ == "__main__":
    train_models()
