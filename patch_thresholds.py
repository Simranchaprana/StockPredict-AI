with open("src/validation/walk_forward.py", "r") as f:
    content = f.read()

import re

# Add new metric arrays
init_metrics = "xgb_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': [], 'trade_acc': [], 'trade_cov': []}"
content = content.replace("    xgb_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': []}", init_metrics)

# Add threshold logic to XGBoost loop
xgb_loop = """        try:
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
"""
content = re.sub(
    r"        try:\n            xgb_metrics\['roc'\]\.append\(roc_auc_score\(y_test_c, xgb_probs\)\)\n        except ValueError:\n            pass",
    xgb_loop,
    content
)

# Calibrate XGBoost final model
calib_xgb = """    from sklearn.calibration import CalibratedClassifierCV
    calibrated_xgb = CalibratedClassifierCV(xgb_classifier, method="isotonic", cv=tscv)
    calibrated_xgb.fit(X, y_class)
    joblib.dump(calibrated_xgb, os.path.join(MODEL_DIR, f"xgb_classifier_{symbol}.pkl"))
"""
content = re.sub(
    r"    xgb_classifier\.fit\(X, y_class\)\n    joblib\.dump\(xgb_classifier, os\.path\.join\(MODEL_DIR, f\"xgb_classifier_\{symbol\}\.pkl\"\)\)",
    calib_xgb,
    content
)

# Backtest simulation with thresholds
bt_logic = """    # Backtest simulation with threshold (BUY > 0.65, SELL < 0.35)
    last_train_idx, last_test_idx = list(tscv.split(X))[-1]
    X_test_backtest = X.iloc[last_test_idx]
    y_test_backtest_actual_returns = train_df.iloc[last_test_idx]['Daily_Return']
    
    xgb_classifier_backtest = XGBClassifier(**xgb_params)
    xgb_classifier_backtest.fit(X.iloc[last_train_idx], y_class.iloc[last_train_idx])
    
    # We use CalibratedClassifierCV to get reliable probabilities out-of-sample
    calib_backtest = CalibratedClassifierCV(xgb_classifier_backtest, method="isotonic", cv="prefit")
    calib_backtest.fit(X.iloc[last_train_idx], y_class.iloc[last_train_idx])
    
    probs = calib_backtest.predict_proba(X_test_backtest)[:, 1]
    
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
"""

content = re.sub(
    r"    # Backtest simulation\n.*?(?=    bh_summary = backtest_summary)",
    bt_logic + "    ",
    content,
    flags=re.DOTALL
)

# Add Trade Acc and Cov to XGBoost metrics
xgb_metrics_export = """        "XGBoost": {
            "accuracy": np.mean(xgb_metrics['acc']),
            "precision": np.mean(xgb_metrics['prec']),
            "recall": np.mean(xgb_metrics['rec']),
            "f1": np.mean(xgb_metrics['f1']),
            "roc_auc": np.mean(xgb_metrics['roc']) if xgb_metrics['roc'] else 0.5,
            "trade_accuracy": np.mean(xgb_metrics['trade_acc']),
            "trade_coverage": np.mean(xgb_metrics['trade_cov'])
        },"""

content = re.sub(
    r'        "XGBoost": \{[^}]+\},',
    xgb_metrics_export,
    content,
    flags=re.MULTILINE
)

with open("src/validation/walk_forward.py", "w") as f:
    f.write(content)
