import re

with open('frontend/src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# Make sure DashboardTabs is imported
if "import DashboardTabs" not in content:
    content = content.replace("import StockSearch from '../components/StockSearch';", "import StockSearch from '../components/StockSearch';\nimport DashboardTabs from '../components/DashboardTabs';")

# Replace the performance and history divs with DashboardTabs
perf_regex = r"(\s*<div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\s*\{performance && \([\s\S]*?\}\)[\s\n]*\{predictionLogs\.length > 0 && \([\s\S]*?</div>\s*</div>\s*\)\}\s*</div>)"

tabs_ui = """
              <DashboardTabs 
                indicators={indicators} 
                performance={performance} 
                predictionLogs={predictionLogs} 
              />"""

content = re.sub(perf_regex, tabs_ui, content)

with open('frontend/src/pages/Dashboard.jsx', 'w') as f:
    f.write(content)
