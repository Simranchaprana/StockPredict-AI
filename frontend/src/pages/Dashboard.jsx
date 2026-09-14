import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockSearch from '../components/StockSearch';
import PriceChart from '../components/PriceChart';
import IndicatorCard from '../components/IndicatorCard';
import PredictionCard from '../components/PredictionCard';

const API_BASE = 'http://localhost:8000/api';

export default function Dashboard() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [stockInfo, setStockInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [predictionLogs, setPredictionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStockData = async (sym) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch basic info
      const infoRes = await axios.get(`${API_BASE}/stock/${sym}`);
      setStockInfo(infoRes.data);

      // Fetch history for chart
      const histRes = await axios.get(`${API_BASE}/history/${sym}?period=1y`);
      setHistory(histRes.data);

      // Fetch indicators
      const indRes = await axios.get(`${API_BASE}/indicators/${sym}`);
      setIndicators(indRes.data);

      // Fetch prediction
      try {
        const predRes = await axios.get(`${API_BASE}/predict/${sym}`);
        setPrediction(predRes.data);
      } catch (err) {
        setPrediction({ error: err.response?.data?.detail || err.message });
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
    fetchStockData(symbol);
  }, []);

  const handleSearch = (newSymbol) => {
    setSymbol(newSymbol);
    fetchStockData(newSymbol);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Analyze and predict stock movements</p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <StockSearch onSearch={handleSearch} />
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
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col sm:flex-row justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{stockInfo.symbol}</h2>
                <p className="text-gray-500 text-sm mt-1">Latest Market Data</p>
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
                <h3 className="text-lg font-medium mb-4 text-gray-900">Price History (1 Year)</h3>
                <PriceChart data={history} />
              </div>
              
              <IndicatorCard indicators={indicators} />
            </div>

            <div className="space-y-6">
              <PredictionCard prediction={prediction} />
              
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
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Logistic Reg.</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Acc</span><span className="font-medium">{(performance['Logistic Regression'].accuracy * 100).toFixed(1)}%</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Prec</span><span className="font-medium">{performance['Logistic Regression'].precision.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Rec</span><span className="font-medium">{performance['Logistic Regression'].recall.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">F1</span><span className="font-medium">{performance['Logistic Regression'].f1.toFixed(2)}</span></div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4 border-gray-200" />
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Backtest Result (1-Fold)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Buy & Hold Return</span>
                      <span className="font-medium text-blue-600">{performance.Backtest.buy_and_hold_return.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Strategy Return</span>
                      <span className="font-medium text-green-600">{performance.Backtest.strategy_return.toFixed(1)}%</span>
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
