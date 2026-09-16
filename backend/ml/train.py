import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.preprocessing import fetch_stock_data
from ml.features import prepare_features, FEATURE_COLS

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

def train_models(symbol="RELIANCE.NS"):
    print(f"Fetching data for {symbol}...")
    df = fetch_stock_data(symbol, period="5y")
    if df.empty:
        raise ValueError(f"No historical data found for {symbol}")
        
    df = prepare_features(df)
    
    train_df = df.dropna(subset=FEATURE_COLS + ['Target', 'Next_Return']).copy()
    
    X = train_df[FEATURE_COLS]
    y_class = train_df['Target']
    y_reg = train_df['Next_Return']
    
    tscv = TimeSeriesSplit(n_splits=5)
    
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    
    # Tuning Logistic Regression with Scaler and Balanced weights
    lr = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight='balanced'))
    
    # Tuning Random Forest with better hyperparameters to reduce overfitting and improve edge
    rf_classifier = RandomForestClassifier(
        n_estimators=200, 
        max_depth=15, 
        min_samples_split=10, 
        min_samples_leaf=5,
        random_state=42
    )
    rf_regressor = RandomForestRegressor(
        n_estimators=100, 
        max_depth=10, 
        random_state=42
    )
    
    lr_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': []}
    rf_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': []}
    reg_metrics = {'mae': [], 'r2': []}
    
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train_c, y_test_c = y_class.iloc[train_index], y_class.iloc[test_index]
        y_train_r, y_test_r = y_reg.iloc[train_index], y_reg.iloc[test_index]
        
        # Logistic Regression
        lr.fit(X_train, y_train_c)
        lr_preds = lr.predict(X_test)
        lr_probs = lr.predict_proba(X_test)[:, 1]
        lr_metrics['acc'].append(accuracy_score(y_test_c, lr_preds))
        lr_metrics['prec'].append(precision_score(y_test_c, lr_preds, zero_division=0))
        lr_metrics['rec'].append(recall_score(y_test_c, lr_preds, zero_division=0))
        lr_metrics['f1'].append(f1_score(y_test_c, lr_preds, zero_division=0))
        try:
            lr_metrics['roc'].append(roc_auc_score(y_test_c, lr_probs))
        except ValueError:
            pass
            
        # Random Forest Classifier
        rf_classifier.fit(X_train, y_train_c)
        rf_preds = rf_classifier.predict(X_test)
        rf_probs = rf_classifier.predict_proba(X_test)[:, 1]
        rf_metrics['acc'].append(accuracy_score(y_test_c, rf_preds))
        rf_metrics['prec'].append(precision_score(y_test_c, rf_preds, zero_division=0))
        rf_metrics['rec'].append(recall_score(y_test_c, rf_preds, zero_division=0))
        rf_metrics['f1'].append(f1_score(y_test_c, rf_preds, zero_division=0))
        try:
            rf_metrics['roc'].append(roc_auc_score(y_test_c, rf_probs))
        except ValueError:
            pass
        
        # Random Forest Regressor
        rf_regressor.fit(X_train, y_train_r)
        reg_preds = rf_regressor.predict(X_test)
        reg_metrics['mae'].append(mean_absolute_error(y_test_r, reg_preds))
        reg_metrics['r2'].append(r2_score(y_test_r, reg_preds))
    
    # Train final models on all data
    from sklearn.calibration import CalibratedClassifierCV, calibration_curve
    calibrated_rf = CalibratedClassifierCV(rf_classifier, method="isotonic", cv=tscv)
    calibrated_rf.fit(X, y_class)
    
    rf_regressor.fit(X, y_reg)
    lr.fit(X, y_class)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Save models per symbol
    joblib.dump(calibrated_rf, os.path.join(MODEL_DIR, f"rf_classifier_{symbol}.pkl"))
    joblib.dump(rf_regressor, os.path.join(MODEL_DIR, f"rf_regressor_{symbol}.pkl"))
    
    # Backtest simulation
    last_train_idx, last_test_idx = list(tscv.split(X))[-1]
    X_test_backtest = X.iloc[last_test_idx]
    y_test_backtest_actual_returns = train_df.iloc[last_test_idx]['Daily_Return']
    
    rf_classifier_backtest = RandomForestClassifier(
        n_estimators=200, 
        max_depth=15, 
        min_samples_split=10, 
        min_samples_leaf=5,
        random_state=42
    )
    rf_classifier_backtest.fit(X.iloc[last_train_idx], y_class.iloc[last_train_idx])
    signals = rf_classifier_backtest.predict(X_test_backtest)
    
    # Equity curve calculations
    from ml.metrics import backtest_summary
    
    initial_capital = 100000
    equity_curve_bh = [initial_capital]
    equity_curve_strategy = [initial_capital]
    
    daily_returns_bh = []
    daily_returns_strategy = []
    
    for i, signal in enumerate(signals):
        ret = y_test_backtest_actual_returns.iloc[i]
        
        # Buy and Hold
        bh_ret = ret
        daily_returns_bh.append(bh_ret)
        equity_curve_bh.append(equity_curve_bh[-1] * (1 + bh_ret))
        
        # Strategy (UP only)
        strat_ret = ret if signal == 1 else 0
        daily_returns_strategy.append(strat_ret)
        equity_curve_strategy.append(equity_curve_strategy[-1] * (1 + strat_ret))
        
    bh_summary = backtest_summary(np.array(equity_curve_bh), np.array(daily_returns_bh))
    strat_summary = backtest_summary(np.array(equity_curve_strategy), np.array(daily_returns_strategy))
    
    metrics = {
        "Random Forest": {
            "accuracy": np.mean(rf_metrics['acc']),
            "precision": np.mean(rf_metrics['prec']),
            "recall": np.mean(rf_metrics['rec']),
            "f1": np.mean(rf_metrics['f1']),
            "roc_auc": np.mean(rf_metrics['roc']) if rf_metrics['roc'] else 0.5,
        },
        "Logistic Regression": {
            "accuracy": np.mean(lr_metrics['acc']),
            "precision": np.mean(lr_metrics['prec']),
            "recall": np.mean(lr_metrics['rec']),
            "f1": np.mean(lr_metrics['f1']),
            "roc_auc": np.mean(lr_metrics['roc']) if lr_metrics['roc'] else 0.5,
        },
        "Regressor": {
            "mae": np.mean(reg_metrics['mae']),
            "r2": np.mean(reg_metrics['r2']),
        },
        "Backtest": {
            "buy_and_hold_return": bh_summary['final_return_pct'],
            "buy_and_hold_sharpe": bh_summary['sharpe'],
            "buy_and_hold_max_dd": bh_summary['max_drawdown'],
            "strategy_return": strat_summary['final_return_pct'],
            "strategy_sharpe": strat_summary['sharpe'],
            "strategy_max_dd": strat_summary['max_drawdown'],
            "strategy_win_rate": strat_summary['win_rate']
        }
    }
    
    joblib.dump(metrics, os.path.join(MODEL_DIR, f"metrics_{symbol}.joblib"))
    print(f"Successfully trained and saved models for {symbol}")
    return metrics

if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else "RELIANCE.NS"
    train_models(symbol)
