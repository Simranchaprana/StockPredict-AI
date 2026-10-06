with open("src/dashboard/src/components/ModelPerformanceTab.jsx", "r") as f:
    content = f.read()

import re

# Add column header
content = content.replace('<th className="px-4 py-3 text-center font-semibold text-blue-700 bg-blue-50">Random Forest</th>',
                          '<th className="px-4 py-3 text-center font-semibold text-blue-700 bg-blue-50">XGBoost</th>\n              <th className="px-4 py-3 text-center font-semibold text-gray-700">Random Forest</th>')

# Replace cells for each row
def add_cell(metric, format_str, is_pct=False):
    # Example: <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{(performance['Random Forest'].accuracy * 100).toFixed(1)}%</td>
    old = f'<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{{(performance[\'Random Forest\'].{metric}{format_str})}}{"%" if is_pct else ""}</td>'
    xgb_str = f'<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{{(performance[\'XGBoost\']?.{metric}{format_str})}}{"%" if is_pct else ""}</td>'
    rf_str = f'<td className="px-4 py-3 text-center text-gray-600">{{(performance[\'Random Forest\']?.{metric}{format_str})}}{"%" if is_pct else ""}</td>'
    
    return old, xgb_str + "\n              " + rf_str

content = content.replace(*add_cell("accuracy", " * 100).toFixed(1)", True))
content = content.replace(*add_cell("precision", ".toFixed(2)"))
content = content.replace(*add_cell("recall", ".toFixed(2)"))
content = content.replace(*add_cell("f1", ".toFixed(2)"))

# ROC is slightly different
old_roc = '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'Random Forest\'].roc_auc ? performance[\'Random Forest\'].roc_auc.toFixed(2) : \'N/A\'}</td>'
new_roc = '<td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance[\'XGBoost\']?.roc_auc ? performance[\'XGBoost\'].roc_auc.toFixed(2) : \'N/A\'}</td>\n              <td className="px-4 py-3 text-center text-gray-600">{performance[\'Random Forest\']?.roc_auc ? performance[\'Random Forest\'].roc_auc.toFixed(2) : \'N/A\'}</td>'
content = content.replace(old_roc, new_roc)

with open("src/dashboard/src/components/ModelPerformanceTab.jsx", "w") as f:
    f.write(content)
