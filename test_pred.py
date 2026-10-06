import sys
import pandas as pd
sys.path.append('backend')
from ml.predict import predict_next_day

print(predict_next_day("RELIANCE.NS"))
