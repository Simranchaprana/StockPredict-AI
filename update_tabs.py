import re

with open('frontend/src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# Add activeTab state
if "const [activeTab, setActiveTab]" not in content:
    state_anchor = "const [chartPeriod, setChartPeriod] = useState('5y');\n"
    content = content.replace(state_anchor, state_anchor + "  const [activeTab, setActiveTab] = useState(0);\n")

# Extract the IndicatorCard code block from the right side:
ind_regex = r"(\s+<IndicatorCard indicators=\{indicators\} />\n)"
match_ind = re.search(ind_regex, content)
ind_card = match_ind.group(1) if match_ind else "              <IndicatorCard indicators={indicators} />\n"
if match_ind:
    content = content.replace(match_ind.group(1), "")

# Extract Performance and History Logs from the left side:
# The performance block starts at {performance && (
# It ends at               )} before {predictionLogs.length > 0 && (
perf_regex = r"(\s*\{performance && \([\s\S]*?\}\s*\)\}\s*)(?=\{predictionLogs\.length > 0)"
match_perf = re.search(perf_regex, content)
perf_card = match_perf.group(1) if match_perf else ""

hist_regex = r"(\s*\{predictionLogs\.length > 0 && \([\s\S]*?</div>\s*</div>\s*\)\}\s*)(?=</div>\s*</div>\s*<div className=\"space-y-6\">)"
match_hist = re.search(hist_regex, content)
hist_card = match_hist.group(1) if match_hist else ""

# Remove them from the current location
if match_perf:
    content = content.replace(match_perf.group(1), "")
if match_hist:
    content = content.replace(match_hist.group(1), "")

# We need to remove the wrapper <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> that surrounded them
grid_wrapper_regex = r"(\s*<div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\s*</div>\s*)"
content = re.sub(grid_wrapper_regex, "", content)

# Now, we construct the Tabs UI
tabs_ui = """
              <div className="bg-white rounded-lg shadow border border-gray-100 mt-6 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50">
                  <nav className="flex -mb-px px-2" aria-label="Tabs">
                    {['Technical Indicators', 'Model Performance', 'Prediction History'].map((tab, idx) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(idx)}
                        className={`whitespace-nowrap py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === idx
                            ? 'border-blue-500 text-blue-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-0">
                  {activeTab === 0 && (
                    <div className="p-4">
""" + ind_card + """                    </div>
                  )}
                  {activeTab === 1 && (
                    <div className="p-0 border-t-0">
""" + perf_card + """                    </div>
                  )}
                  {activeTab === 2 && (
                    <div className="p-0 border-t-0">
""" + hist_card + """                    </div>
                  )}
                </div>
              </div>
"""

# Insert Tabs UI after PriceChart
chart_anchor = "                <PriceChart data={history} />\n              </div>\n"
content = content.replace(chart_anchor, chart_anchor + tabs_ui)

with open('frontend/src/pages/Dashboard.jsx', 'w') as f:
    f.write(content)
print("Done")
