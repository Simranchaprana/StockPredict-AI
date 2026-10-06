with open("src/validation/walk_forward.py", "r") as f:
    content = f.read()

import re
content = re.sub(
    r"train_df = df\.dropna\(subset=active_features \+ \['Target', 'Next_Return'\]\)\.copy\(\)",
    "import numpy as np\n    df.replace([np.inf, -np.inf], np.nan, inplace=True)\n    train_df = df.dropna(subset=active_features + ['Target', 'Next_Return']).copy()",
    content
)

with open("src/validation/walk_forward.py", "w") as f:
    f.write(content)
