import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.ingestion.fetch import fetch_stock_data, fetch_market_context
from src.ingestion.news import fetch_historical_sentiment
from src.features.build import prepare_features, FEATURE_COLS
from src.config import config

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "saved_models")

def train_models(symbol=None):
    if not symbol:
        symbol = config.get('tickers', ["RELIANCE.NS"])[0]
    
    print(f"Fetching data for {symbol}...")
    df = fetch_stock_data(symbol, period="5y")
    if df.empty:
        raise ValueError(f"No historical data found for {symbol}")
        
    context_df = fetch_market_context(symbol, df.index, period="5y")
    if not context_df.empty:
        df = pd.concat([df, context_df], axis=1)
        
    sentiment_df = fetch_historical_sentiment(symbol, df.index)
    if not sentiment_df.empty:
        df = pd.concat([df, sentiment_df], axis=1)
        
    df = prepare_features(df)
    
    # Filter FEATURE_COLS to only those present (in case a context feature didn't fetch)
    active_features = [col for col in FEATURE_COLS if col in df.columns]
    import numpy as np
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    train_df = df.dropna(subset=active_features + ['Target', 'Next_Return']).copy()
    
    X = train_df[active_features]
    y_class = train_df['Target']
    y_reg = train_df['Next_Return']
    
    n_splits = config.get('validation', {}).get('n_splits', 5)
    tscv = TimeSeriesSplit(n_splits=n_splits, gap=1)
    
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    
    # Logistic Regression
    lr_params = config.get('model_params', {}).get('logistic_regression', {'max_iter': 1000, 'class_weight': 'balanced'})
    lr = make_pipeline(StandardScaler(), LogisticRegression(**lr_params))
    
    # Random Forest
    rf_c_params = config.get('model_params', {}).get('rf_classifier', {'n_estimators': 200, 'max_depth': 15, 'min_samples_split': 10, 'min_samples_leaf': 5, 'random_state': 42})
    rf_classifier = RandomForestClassifier(**rf_c_params)
    
    rf_r_params = config.get('model_params', {}).get('rf_regressor', {'n_estimators': 100, 'max_depth': 10, 'random_state': 42})
    rf_regressor = RandomForestRegressor(**rf_r_params)
    
    # XGBoost
    xgb_params = config.get('model_params', {}).get('xgboost', {'n_estimators': 100, 'max_depth': 5, 'learning_rate': 0.1, 'random_state': 42})
    xgb_classifier = XGBClassifier(**xgb_params)
    
    xgb_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': [], 'trade_acc': [], 'trade_cov': []}
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
            
        
        # XGBoost
        xgb_classifier.fit(X_train, y_train_c)
        xgb_preds = xgb_classifier.predict(X_test)
        xgb_probs = xgb_classifier.predict_proba(X_test)[:, 1]
        xgb_metrics['acc'].append(accuracy_score(y_test_c, xgb_preds))
        xgb_metrics['prec'].append(precision_score(y_test_c, xgb_preds, zero_division=0))
        xgb_metrics['rec'].append(recall_score(y_test_c, xgb_preds, zero_division=0))
        xgb_metrics['f1'].append(f1_score(y_test_c, xgb_preds, zero_division=0))
        try:
            xgb_metrics['roc'].append(roc_auc_score(y_test_c, xgb_probs))
        except ValueError:
            pass
            
        # Threshold logic
        high_conf = (xgb_probs >= 0.65) | (xgb_probs <= 0.35)
        if high_conf.sum() > 0:
            hc_preds = (xgb_probs[high_conf] >= 0.65).astype(int)
            xgb_metrics['trade_acc'].append(accuracy_score(y_test_c.iloc[high_conf], hc_preds))
            xgb_metrics['trade_cov'].append(high_conf.mean())
        else:
            xgb_metrics['trade_acc'].append(0.0)
            xgb_metrics['trade_cov'].append(0.0)


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
        reg_pred_return = rf_regressor.predict(X_test)
        current_prices = train_df.loc[X_test.index, 'Close']
        actual_prices = current_prices * (1 + y_test_r)
        predicted_prices = current_prices * (1 + reg_pred_return)
        
        reg_metrics['mae'].append(mean_absolute_error(actual_prices, predicted_prices))
        reg_metrics['r2'].append(r2_score(actual_prices, predicted_prices))
    
    # Train final models on all data
    from sklearn.calibration import CalibratedClassifierCV
    calibrated_rf = CalibratedClassifierCV(rf_classifier, method="isotonic", cv=tscv)
    calibrated_rf.fit(X, y_class)
    
    rf_regressor.fit(X, y_reg)
    lr.fit(X, y_class)
    from sklearn.calibration import CalibratedClassifierCV
    calibrated_xgb = CalibratedClassifierCV(xgb_classifier, method="isotonic", cv=tscv)
    calibrated_xgb.fit(X, y_class)
    joblib.dump(calibrated_xgb, os.path.join(MODEL_DIR, f"xgb_classifier_{symbol}.pkl"))


    
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    joblib.dump(calibrated_rf, os.path.join(MODEL_DIR, f"rf_classifier_{symbol}.pkl"))
    joblib.dump(rf_regressor, os.path.join(MODEL_DIR, f"rf_regressor_{symbol}.pkl"))
    joblib.dump(lr, os.path.join(MODEL_DIR, f"lr_classifier_{symbol}.pkl"))
    
    # Backtest simulation with threshold (BUY > 0.65, SELL < 0.35)
    last_train_idx, last_test_idx = list(tscv.split(X))[-1]
    X_test_backtest = X.iloc[last_test_idx]
    y_test_backtest_actual_returns = train_df.iloc[last_test_idx]['Next_Return']
    
    xgb_classifier_backtest = XGBClassifier(**xgb_params)
    xgb_classifier_backtest.fit(X.iloc[last_train_idx], y_class.iloc[last_train_idx])
    
    probs = xgb_classifier_backtest.predict_proba(X_test_backtest)[:, 1]
    
    from src.backtest.metrics import backtest_summary
    
    initial_capital = config.get('backtest', {}).get('initial_capital', 100000)
    equity_curve_bh = [initial_capital]
    equity_curve_strategy = [initial_capital]
    
    daily_returns_bh = []
    daily_returns_strategy = []
    
    for i, prob in enumerate(probs):
        ret = y_test_backtest_actual_returns.iloc[i]
        bh_ret = ret
        daily_returns_bh.append(bh_ret)
        equity_curve_bh.append(equity_curve_bh[-1] * (1 + bh_ret))
        
        # BUY/HOLD/SELL Logic
        if prob >= 0.65:
            strat_ret = ret      # BUY
        elif prob <= 0.35:
            strat_ret = -ret     # SELL (Short)
        else:
            strat_ret = 0        # HOLD
            
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
        "XGBoost": {
            "accuracy": np.mean(xgb_metrics['acc']),
            "precision": np.mean(xgb_metrics['prec']),
            "recall": np.mean(xgb_metrics['rec']),
            "f1": np.mean(xgb_metrics['f1']),
            "roc_auc": np.mean(xgb_metrics['roc']) if xgb_metrics['roc'] else 0.5,
            "trade_accuracy": np.mean(xgb_metrics['trade_acc']),
            "trade_coverage": np.mean(xgb_metrics['trade_cov'])
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
            "buy_and_hold_cagr": bh_summary['cagr'],
            "strategy_return": strat_summary['final_return_pct'],
            "strategy_sharpe": strat_summary['sharpe'],
            "strategy_max_dd": strat_summary['max_drawdown'],
            "strategy_win_rate": strat_summary['win_rate'],
            "strategy_cagr": strat_summary['cagr']
        }
    }
    
    joblib.dump(metrics, os.path.join(MODEL_DIR, f"metrics_{symbol}.joblib"))
    print(f"Successfully trained and saved models for {symbol}")
    return metrics

if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else None
    train_models(symbol)
