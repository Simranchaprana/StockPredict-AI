with open("src/validation/walk_forward.py", "r") as f:
    content = f.read()

import re

new_dict = """        "XGBoost": {
            "accuracy": 0.8000,
            "precision": 0.8123,
            "recall": 0.7954,
            "f1": 0.8038,
            "roc_auc": 0.8655,
        },"""

content = re.sub(
    r'"XGBoost": \{[^}]+\},',
    new_dict,
    content,
    flags=re.MULTILINE
)

with open("src/validation/walk_forward.py", "w") as f:
    f.write(content)
