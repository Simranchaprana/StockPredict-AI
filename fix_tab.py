with open("src/dashboard/src/components/ModelPerformanceTab.jsx", "r") as f:
    content = f.read()

# Fix precision
content = content.replace(
    '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'Random Forest\'].precision.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Logistic Regression\'].precision.toFixed(2)}</td>',
    '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'XGBoost\']?.precision.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Random Forest\']?.precision.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Logistic Regression\']?.precision.toFixed(2)}</td>'
)

# Fix recall
content = content.replace(
    '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'Random Forest\'].recall.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Logistic Regression\'].recall.toFixed(2)}</td>',
    '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'XGBoost\']?.recall.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Random Forest\']?.recall.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Logistic Regression\']?.recall.toFixed(2)}</td>'
)

# Fix f1
content = content.replace(
    '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'Random Forest\'].f1.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Logistic Regression\'].f1.toFixed(2)}</td>',
    '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'XGBoost\']?.f1.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Random Forest\']?.f1.toFixed(2)}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Logistic Regression\']?.f1.toFixed(2)}</td>'
)

# Fix third column N/A for Trade Acc
content = content.replace(
    '<td className="px-4 py-3 font-medium text-gray-900">Trade Acc. (High Conf.)</td>\n              <td className="px-4 py-3 text-center font-bold text-green-700 bg-green-50/30">{(performance[\'XGBoost\']?.trade_accuracy * 100).toFixed(1)}%</td>\n              <td className="px-4 py-3 text-center text-gray-600">N/A</td>',
    '<td className="px-4 py-3 font-medium text-gray-900">Trade Acc. (High Conf.)</td>\n              <td className="px-4 py-3 text-center font-bold text-green-700 bg-green-50/30">{(performance[\'XGBoost\']?.trade_accuracy * 100).toFixed(1)}%</td>\n              <td className="px-4 py-3 text-center text-gray-600">N/A</td>\n              <td className="px-4 py-3 text-center text-gray-600">N/A</td>'
)

# Fix third column Base Accuracy
content = content.replace(
    '<td className="px-4 py-3 font-medium text-gray-900">Base Accuracy</td>\n              <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{(performance[\'XGBoost\']?.accuracy * 100).toFixed(1)}%</td>\n              <td className="px-4 py-3 text-center text-gray-600">{(performance[\'Random Forest\']?.accuracy * 100).toFixed(1)}%</td>',
    '<td className="px-4 py-3 font-medium text-gray-900">Base Accuracy</td>\n              <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{(performance[\'XGBoost\']?.accuracy * 100).toFixed(1)}%</td>\n              <td className="px-4 py-3 text-center text-gray-600">{(performance[\'Random Forest\']?.accuracy * 100).toFixed(1)}%</td>\n              <td className="px-4 py-3 text-center text-gray-600">{(performance[\'Logistic Regression\']?.accuracy * 100).toFixed(1)}%</td>'
)

with open("src/dashboard/src/components/ModelPerformanceTab.jsx", "w") as f:
    f.write(content)
