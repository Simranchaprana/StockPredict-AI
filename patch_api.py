with open("src/api/predict.py", "r") as f:
    content = f.read()

import re

content = content.replace('classifier_path = os.path.join(MODEL_DIR, f"rf_classifier_{symbol}.pkl")',
                          'classifier_path = os.path.join(MODEL_DIR, f"xgb_classifier_{symbol}.pkl")')

pred_logic = """        pred_class = classifier.predict(features)[0]
        probabilities = classifier.predict_proba(features)[0]
        
        prob_up = probabilities[1]
        if prob_up >= 0.65:
            direction = "BUY"
            confidence = prob_up
        elif prob_up <= 0.35:
            direction = "SELL"
            confidence = probabilities[0]
        else:
            direction = "HOLD"
            confidence = max(prob_up, probabilities[0])"""

content = re.sub(
    r"        pred_class = classifier\.predict\(features\)\[0\].*?direction = \"UP\" if pred_class == 1 else \"DOWN\"",
    pred_logic,
    content,
    flags=re.DOTALL
)

# Extracting feature importances for XGBoost which doesn't directly have feature_importances_ if it's calibrated... wait, XGBoost has feature_importances_ natively, but if it is calibrated, it's inside `estimator.calibrated_classifiers_[0].base_estimator.feature_importances_`.
# Our XGBoost was dumped calibrated: 
# `calibrated_xgb = CalibratedClassifierCV(xgb_classifier, method="isotonic", cv=tscv)`
# `joblib.dump(calibrated_xgb, ...)`
# So we need to handle that.
feat_logic = """    importances_dict = {}
    base_clf = classifier
    if hasattr(classifier, 'calibrated_classifiers_'):
        base_clf = classifier.calibrated_classifiers_[0].estimator

    if hasattr(base_clf, 'feature_importances_'):
        importances = base_clf.feature_importances_
        sorted_idx = importances.argsort()[::-1][:10]
        importances_dict = {active_features[i]: round(float(importances[i]), 4) for i in sorted_idx}"""

content = re.sub(
    r"    importances_dict = \{\}\n    if hasattr\(classifier, 'feature_importances_'\):.*?importances_dict = \{active_features\[i\]: round\(float\(importances\[i\]\), 4\) for i in sorted_idx\}",
    feat_logic,
    content,
    flags=re.DOTALL
)

# Replace "Random Forest ML" string
content = content.replace('"model": "Random Forest ML"', '"model": "XGBoost ML"')

with open("src/api/predict.py", "w") as f:
    f.write(content)
