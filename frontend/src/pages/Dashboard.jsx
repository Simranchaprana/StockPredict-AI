import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockSearch from '../components/StockSearch';
import PriceChart from '../components/PriceChart';
import PredictionCard from '../components/PredictionCard';
import IndicatorCard from '../components/IndicatorCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [chartPeriod, setChartPeriod] = useState('1y');
  const [stockInfo, setStockInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [todayPrediction, setTodayPrediction] = useState(null);
  const [intradayPredictions, setIntradayPredictions] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [predictionLogs, setPredictionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStockData = async (sym, period = chartPeriod) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch basic info
      const infoRes = await axios.get(`${API_BASE}/stock/${sym}`);
      setStockInfo(infoRes.data);

      // Fetch history for chart
      const histRes = await axios.get(`${API_BASE}/history/${sym}?period=${period}`);
      setHistory(histRes.data);

      // Fetch indicators
      const indRes = await axios.get(`${API_BASE}/indicators/${sym}`);
      setIndicators(indRes.data);

      // Fetch prediction
      try {
        const predRes = await axios.get(`${API_BASE}/predict/${sym}`);
        setPrediction(predRes.data.next_day_prediction);
        setTodayPrediction(predRes.data.today_prediction);
      } catch (err) {
        setPrediction({ error: err.response?.data?.detail || err.message });
      }

      // Fetch intraday predictions (5m, 8m, 10m)
      try {
        const intradayRes = await axios.get(`${API_BASE}/predict_intraday/${sym}`);
        setIntradayPredictions(intradayRes.data);
      } catch (err) {
        console.error("Intraday prediction failed", err);
        setIntradayPredictions(null);
      }

      // Fetch performance
      try {
        const perfRes = await axios.get(`${API_BASE}/performance/${sym}`);
        setPerformance(perfRes.data);
      } catch (err) {
        setPerformance(null);
      }

      // Fetch logs
      try {
        const logsRes = await axios.get(`${API_BASE}/history_logs/${sym}`);
        setPredictionLogs(logsRes.data);
      } catch (err) {
        setPredictionLogs([]);
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch stock data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(symbol, chartPeriod);
  }, []);

  const handleSearch = (newSymbol) => {
    setSymbol(newSymbol);
    fetchStockData(newSymbol, chartPeriod);
  };

  const handlePeriodChange = (period) => {
    setChartPeriod(period);
    fetchStockData(symbol, period);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col items-center mb-8 pt-4">
        <div className="w-full max-w-2xl">
          <StockSearch onSearch={handleSearch} />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'AAPL', 'MSFT', 'TSLA'].map(sym => (
            <button
              key={sym}
              onClick={() => handleSearch(sym)}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {stockInfo && (
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{stockInfo.symbol}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Data as of: <span className="font-semibold">{stockInfo.date}</span> • Volume: {stockInfo.volume.toLocaleString()}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 text-right">
                <div className="text-3xl font-bold">₹{stockInfo.price.toFixed(2)}</div>
                <div className={`text-lg font-medium ${stockInfo.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockInfo.change >= 0 ? '+' : ''}{stockInfo.change.toFixed(2)} ({stockInfo.pct_change.toFixed(2)}%)
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Price History</h3>
                  <div className="flex space-x-2">
                    {['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePeriodChange(p)}
                        className={`px-3 py-1 text-xs font-medium rounded ${chartPeriod === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <PriceChart data={history} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {performance && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Model Performance (CV)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Random Forest</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Acc</span><span className="font-medium">{(performance['Random Forest'].accuracy * 100).toFixed(1)}%</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Prec</span><span className="font-medium">{performance['Random Forest'].precision.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Rec</span><span className="font-medium">{performance['Random Forest'].recall.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">F1</span><span className="font-medium">{performance['Random Forest'].f1.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">ROC-AUC</span><span className="font-medium">{performance['Random Forest'].roc_auc ? performance['Random Forest'].roc_auc.toFixed(2) : 'N/A'}</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Logistic Reg.</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Acc</span><span className="font-medium">{(performance['Logistic Regression'].accuracy * 100).toFixed(1)}%</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Prec</span><span className="font-medium">{performance['Logistic Regression'].precision.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Rec</span><span className="font-medium">{performance['Logistic Regression'].recall.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">F1</span><span className="font-medium">{performance['Logistic Regression'].f1.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">ROC-AUC</span><span className="font-medium">{performance['Logistic Regression'].roc_auc ? performance['Logistic Regression'].roc_auc.toFixed(2) : 'N/A'}</span></div>

                      </div>
                    </div>
                  </div>

                  <hr className="my-4 border-gray-200" />
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Price Regressor</h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">MAE</span>
                      <span className="font-medium">₹{performance.Regressor.mae.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">R² Score</span>
                      <span className="font-medium">{performance.Regressor.r2.toFixed(3)}</span>
                    </div>
                  </div>

                  <hr className="my-4 border-gray-200" />
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Backtest Result (1-Fold)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-semibold">Strategy Return</span>
                      <span className={`font-bold ${performance.Backtest.strategy_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {performance.Backtest.strategy_return?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Sharpe Ratio</span>
                      <span className={`font-medium ${performance.Backtest.strategy_sharpe >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                        {performance.Backtest.strategy_sharpe?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Max Drawdown</span>
                      <span className="font-medium text-red-600">{performance.Backtest.strategy_max_dd?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Win Rate</span>
                      <span className="font-medium text-gray-700">{performance.Backtest.strategy_win_rate?.toFixed(1)}%</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 font-semibold">Buy & Hold Return</span>
                        <span className={`font-bold ${performance.Backtest.buy_and_hold_return >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {performance.Backtest.buy_and_hold_return?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Sharpe Ratio</span>
                        <span className={`font-medium ${performance.Backtest.buy_and_hold_sharpe >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                          {performance.Backtest.buy_and_hold_sharpe?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Max Drawdown</span>
                        <span className="font-medium text-red-600">{performance.Backtest.buy_and_hold_max_dd?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {predictionLogs.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mt-6">
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Prediction History</h3>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Prediction</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Price Est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {predictionLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs text-gray-500 sm:pl-6">
                              {new Date(log.date).toLocaleDateString()}
                            </td>
                            <td className={`whitespace-nowrap px-3 py-2 text-xs font-medium ${log.prediction_direction === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                              {log.prediction_direction}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                              ₹{log.predicted_price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}              </div>
            </div>

            <div className="space-y-6">
              {intradayPredictions && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                  <div className="mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">
                      Today's Prediction (Live Scalping)
                    </h3>
                    <p className="text-sm text-gray-500">
                      Real-time high-frequency AI predictions for the next few minutes.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['5min', '8min', '10min'].map(interval => {
                      const pred = intradayPredictions[interval];
                      if (!pred || pred.error) return null;
                      const isUp = pred.prediction === 'UP';
                      return (
                        <div key={interval} className={`p-3 rounded-lg text-center border ${isUp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">{interval}</div>
                          <div className={`text-2xl font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {pred.prediction}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 font-medium">
                            Valid Until: {pred.target_time}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            {(pred.confidence * 100).toFixed(1)}% confidence
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <PredictionCard prediction={prediction} />
              <IndicatorCard indicators={indicators} />
              

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
