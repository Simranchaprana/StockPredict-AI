with open("src/validation/walk_forward.py", "r") as f:
    content = f.read()

import re

# Add xgboost import
if "from xgboost import XGBClassifier" not in content:
    content = content.replace("from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor", 
                              "from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor\nfrom xgboost import XGBClassifier")
    if "from xgboost import XGBClassifier" not in content:
        content = content.replace("from sklearn.pipeline import make_pipeline",
                                  "from xgboost import XGBClassifier\n    from sklearn.pipeline import make_pipeline")

# Add XGBoost initialization
xgb_init = """    # XGBoost
    xgb_params = config.get('model_params', {}).get('xgboost', {'n_estimators': 100, 'max_depth': 5, 'learning_rate': 0.1, 'random_state': 42})
    xgb_classifier = XGBClassifier(**xgb_params)
    
    xgb_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'roc': []}
"""
content = content.replace("    lr_metrics = ", xgb_init + "    lr_metrics = ")

# Add XGBoost training/prediction loop
xgb_loop = """        
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
"""
content = content.replace("        # Random Forest Classifier", xgb_loop + "\n        # Random Forest Classifier")

# Add XGBoost final training and dump
xgb_dump = """    xgb_classifier.fit(X, y_class)
    joblib.dump(xgb_classifier, os.path.join(MODEL_DIR, f"xgb_classifier_{symbol}.pkl"))
"""
content = content.replace("    lr.fit(X, y_class)", "    lr.fit(X, y_class)\n" + xgb_dump)

# Add XGBoost metrics
xgb_dict = """        "XGBoost": {
            "accuracy": np.mean(xgb_metrics['acc']),
            "precision": np.mean(xgb_metrics['prec']),
            "recall": np.mean(xgb_metrics['rec']),
            "f1": np.mean(xgb_metrics['f1']),
            "roc_auc": np.mean(xgb_metrics['roc']) if xgb_metrics['roc'] else 0.5,
        },
"""
content = content.replace('        "Logistic Regression": {', xgb_dict + '        "Logistic Regression": {')

with open("src/validation/walk_forward.py", "w") as f:
    f.write(content)
