import yfinance as yf
ticker = yf.Ticker("RELIANCE.NS")
print("1d period:")
print(ticker.history(period="1d").head(2))
print("5d period:")
print(ticker.history(period="5d").head(2))
print("1mo period:")
print(ticker.history(period="1mo").head(2))
