import re

with open('frontend/src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# We want to change the layout block around line 136-166.
# Current layout string:
# <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
#   <div className="lg:col-span-2 space-y-6">
#     <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
#       ...
#       <PriceChart data={history} />
#     </div>
#     
#     <IndicatorCard indicators={indicators} />
#   </div>

#   <div className="space-y-6">

# New layout string:
# <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
#   <div className="lg:col-span-2 space-y-6">
#     <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
#       ...
#       <PriceChart data={history} />
#     </div>
#
#     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
#       {performance && ( ... )}
#       {predictionLogs.length > 0 && ( ... )}
#     </div>
#   </div>

#   <div className="space-y-6">
#     {intradayPredictions && ( ... )}
#     <PredictionCard prediction={prediction} />
#     <IndicatorCard indicators={indicators} />

# I'll just extract the IndicatorCard string and the Performance/History strings and swap them.

ind_regex = r"(\s+<IndicatorCard indicators=\{indicators\} />\n)"
match = re.search(ind_regex, content)
indicator_card_str = match.group(1)
content = content.replace(indicator_card_str, "\n              <div id='BOTTOM_GRID'></div>\n")

# Find Performance and History Logs
perf_regex = r"(\s+\{performance && \([\s\S]*?\}\)[\s]*\n)(?=\s+\{predictionLogs)"
match2 = re.search(perf_regex, content)
if match2:
    perf_str = match2.group(1)
    content = content.replace(perf_str, "")
else:
    print("perf not found")

hist_regex = r"(\s+\{predictionLogs\.length > 0 && \([\s\S]*?</div>\n\s+\)\})"
match3 = re.search(hist_regex, content)
if match3:
    hist_str = match3.group(1)
    content = content.replace(hist_str, "")
else:
    print("hist not found")

# Insert performance and history into BOTTOM_GRID
if match2 and match3:
    bottom_grid = "\n              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n" + perf_str + hist_str + "              </div>\n"
    content = content.replace("              <div id='BOTTOM_GRID'></div>", bottom_grid)

# Put IndicatorCard after PredictionCard
pred_card_regex = r"(\s+<PredictionCard prediction=\{prediction\} />\n)"
match4 = re.search(pred_card_regex, content)
if match4:
    content = content.replace(match4.group(1), match4.group(1) + indicator_card_str)

with open('frontend/src/pages/Dashboard.jsx', 'w') as f:
    f.write(content)
