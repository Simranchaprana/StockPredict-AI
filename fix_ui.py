import re

with open('frontend/src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# Fix prediction history date to include time
hist_old = """                            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs text-gray-500 sm:pl-6">
                              {new Date(log.date).toLocaleDateString()}
                            </td>"""
hist_new = """                            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs text-gray-500 sm:pl-6">
                              {new Date(log.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>"""
content = content.replace(hist_old, hist_new)

# Fix Intraday Card (Today's Prediction)
# Make 'valid till' mentioned once, and confidence pop
intraday_old_regex = r"(<h3 className=\"text-lg leading-6 font-medium text-gray-900 mb-1\">\s*Today's Prediction \(Live Scalping\)\s*</h3>\s*<p className=\"text-sm text-gray-500\">\s*Real-time high-frequency AI predictions for the next few minutes\.\s*</p>\s*</div>\s*<div className=\"grid grid-cols-3 gap-3\">\s*\{\['5min', '8min', '10min'\]\.map\(interval => \{\s*const pred = intradayPredictions\[interval\];\s*if \(!pred \|\| pred\.error\) return null;\s*const isUp = pred\.prediction === 'UP';\s*return \(\s*<div key=\{interval\} className=\{`p-3 rounded-lg text-center border \$\{isUp \? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'\}`\}>\s*<div className=\"text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider\">\{interval\}</div>\s*<div className=\{`text-2xl font-bold \$\{isUp \? 'text-green-600' : 'text-red-600'\}`\}>\s*\{pred\.prediction\}\s*</div>\s*<div className=\"text-xs text-gray-500 mt-2 font-medium\">\s*Valid Until: \{pred\.target_time\}\s*</div>\s*<div className=\"text-\[10px\] text-gray-400 mt-1\">\s*\{\(pred\.confidence \* 100\)\.toFixed\(1\)\}% confidence\s*</div>\s*</div>\s*\);\s*\}\)\}\s*</div>)"

intraday_new = """<h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">
                      Today's Prediction (Live Scalping)
                    </h3>
                    <p className="text-sm text-gray-500 flex justify-between">
                      <span>High-frequency AI signals</span>
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">Target Times Below</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['5min', '8min', '10min'].map(interval => {
                      const pred = intradayPredictions[interval];
                      if (!pred || pred.error) return null;
                      const isUp = pred.prediction === 'UP';
                      return (
                        <div key={interval} className={`p-3 rounded-lg flex flex-col items-center justify-between text-center border shadow-sm ${isUp ? 'bg-gradient-to-b from-green-50 to-white border-green-200' : 'bg-gradient-to-b from-red-50 to-white border-red-200'}`}>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{interval}</div>
                          <div className={`text-2xl font-black my-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {pred.prediction}
                          </div>
                          <div className={`mt-1 mb-2 inline-block px-2 py-1 rounded text-xs font-bold text-white shadow-sm ${isUp ? 'bg-green-500' : 'bg-red-500'}`}>
                            {(pred.confidence * 100).toFixed(1)}% Conf
                          </div>
                          <div className="text-[11px] text-gray-600 font-medium">
                            {pred.target_time}
                          </div>
                        </div>
                      );
                    })}
                  </div>"""

content = re.sub(intraday_old_regex, intraday_new, content)

with open('frontend/src/pages/Dashboard.jsx', 'w') as f:
    f.write(content)
