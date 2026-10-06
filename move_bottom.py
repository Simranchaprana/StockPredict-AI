import re

with open('frontend/src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# Grab the block from {performance && ( to the end of {predictionLogs.length > 0 && (...) }
start_str = "              {performance && ("
end_str = "                  </div>\n                </div>\n              )}\n            </div>\n          </div>"

start_idx = content.find(start_str)
end_idx = content.find(end_str) + len(end_str) - len("\n            </div>\n          </div>")

if start_idx == -1 or end_idx == -1:
    print("Could not find blocks")
else:
    block_to_move = content[start_idx:end_idx]
    
    # Remove from original location
    content = content[:start_idx] + content[end_idx:]
    
    # We want to insert it after the PriceChart div in the left column.
    # Look for:
    #                 <PriceChart data={history} />
    #               </div>
    #             </div>
    
    target = "                <PriceChart data={history} />\n              </div>\n"
    target_idx = content.find(target) + len(target)
    
    # Wrap in grid-cols-2
    wrapped_block = "              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n" + block_to_move + "              </div>\n"
    
    content = content[:target_idx] + wrapped_block + content[target_idx:]
    
    with open('frontend/src/pages/Dashboard.jsx', 'w') as f:
        f.write(content)
    print("Moved successfully")
