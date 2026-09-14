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
        const perfRes = await axios.get(`${API_BASE}/performance`);
        setPerformance(perfRes.data);
      } catch (err) {
        setPerformance(null);
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
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Model Performance</h3>
                  <p className="text-sm text-gray-500 mb-4">Random Forest CV Metrics (TimeSeriesSplit)</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accuracy</span>
                      <span className="font-medium">{(performance['Random Forest'].accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precision</span>
                      <span className="font-medium">{performance['Random Forest'].precision.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Recall</span>
                      <span className="font-medium">{performance['Random Forest'].recall.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">F1 Score</span>
                      <span className="font-medium">{performance['Random Forest'].f1.toFixed(2)}</span>
                    </div>
                  </div>

                  <hr className="my-4 border-gray-200" />
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Backtest Result (Last Fold)</h4>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
