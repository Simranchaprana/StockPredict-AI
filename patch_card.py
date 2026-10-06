with open("src/dashboard/src/components/PredictionCard.jsx", "r") as f:
    content = f.read()

import re

# Fix direction color and icon
dir_logic = """  const isBuy = prediction.prediction === 'BUY';
  const isSell = prediction.prediction === 'SELL';
  const isHold = prediction.prediction === 'HOLD';
  const confidencePct = (prediction.confidence * 100).toFixed(1);

  let dirColor = 'text-gray-500';
  let barColor = 'bg-gray-400';
  let DirIcon = AlertCircle;
  if (isBuy) {
    dirColor = 'text-green-600';
    barColor = 'bg-green-500';
    DirIcon = TrendingUp;
  } else if (isSell) {
    dirColor = 'text-red-600';
    barColor = 'bg-red-500';
    DirIcon = TrendingDown;
  }
"""

content = re.sub(
    r"  const isUp = prediction\.prediction === 'UP';\n  const confidencePct = \(prediction\.confidence \* 100\)\.toFixed\(1\);",
    dir_logic,
    content
)

content = re.sub(
    r"<div className=\{\`mt-1 flex items-center text-3xl font-bold \$\{isUp \? 'text-green-600' : 'text-red-600'\}\`\}>\n              \{isUp \? <TrendingUp className=\"w-8 h-8 mr-2\" /> : <TrendingDown className=\"w-8 h-8 mr-2\" />\}\n              \{prediction\.prediction\}\n            </div>",
    """<div className={`mt-1 flex items-center text-3xl font-bold ${dirColor}`}>
              <DirIcon className="w-8 h-8 mr-2" />
              {prediction.prediction}
            </div>""",
    content
)

content = re.sub(
    r"className=\{\`h-2\.5 rounded-full \$\{isUp \? 'bg-green-500' : 'bg-red-500'\}\`\}",
    "className={`h-2.5 rounded-full ${barColor}`}",
    content
)

content = content.replace(
    'Top driving features for this prediction (Random Forest Gini Importance):',
    'Top driving features for this prediction (XGBoost Split Importance):'
)

with open("src/dashboard/src/components/PredictionCard.jsx", "w") as f:
    f.write(content)
