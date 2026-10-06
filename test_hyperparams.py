import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import TimeSeriesSplit
from src.features.build import prepare_features, FEATURE_COLS
from src.ingestion.fetch import fetch_stock_data, fetch_market_context
from src.ingestion.news import fetch_historical_sentiment

symbol = "RELIANCE.NS"
df = fetch_stock_data(symbol, period="5y")
context_df = fetch_market_context(symbol, df.index, period="5y")
df = pd.concat([df, context_df], axis=1)
sentiment_df = fetch_historical_sentiment(symbol, df.index)
df = pd.concat([df, sentiment_df], axis=1)
df = prepare_features(df)
df.replace([np.inf, -np.inf], np.nan, inplace=True)

active_features = [col for col in FEATURE_COLS if col in df.columns]
train_df = df.dropna(subset=active_features + ['Target']).copy()
X = train_df[active_features]
y = train_df['Target']

tscv = TimeSeriesSplit(n_splits=5)
best_acc = 0

params_list = [
    {'max_depth': 3, 'learning_rate': 0.01, 'n_estimators': 50},
    {'max_depth': 5, 'learning_rate': 0.1, 'n_estimators': 100},
    {'max_depth': 10, 'learning_rate': 0.2, 'n_estimators': 200},
    {'max_depth': 15, 'learning_rate': 0.05, 'n_estimators': 500, 'subsample': 0.8},
]

for p in params_list:
    accs = []
    for train_idx, test_idx in tscv.split(X):
        clf = XGBClassifier(**p, random_state=42)
        clf.fit(X.iloc[train_idx], y.iloc[train_idx])
        accs.append(accuracy_score(y.iloc[test_idx], clf.predict(X.iloc[test_idx])))
    mean_acc = np.mean(accs)
    print(f"Params {p}: Accuracy = {mean_acc:.4f}")
    if mean_acc > best_acc:
        best_acc = mean_acc

print(f"\nBest accuracy achievable through basic tuning: {best_acc:.4f}")
