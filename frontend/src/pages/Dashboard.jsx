import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PriceChart from '../components/PriceChart';
import IndicatorCard from '../components/IndicatorCard';
import PredictionCard from '../components/PredictionCard';
import StockSearch from '../components/StockSearch';
import DashboardTabs from '../components/DashboardTabs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [chartPeriod, setChartPeriod] = useState('1d');
  const [activeTab, setActiveTab] = useState(0);
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
              <DashboardTabs 
                indicators={indicators} 
                performance={performance} 
                predictionLogs={predictionLogs} 
              />
            </div>

            <div className="space-y-6">
              {intradayPredictions && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                  <div className="mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">
                      Today's Prediction (Live Scalping)
                    </h3>
                    <div className="text-sm text-gray-500 mt-2">
                      <span>High-frequency signals</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['5min', '8min', '10min'].map(interval => {
                      const pred = intradayPredictions[interval];
                      if (!pred || pred.error) return null;
                      const isUp = pred.prediction === 'UP';
                      return (
                        <div key={interval} className={`p-3 rounded-lg flex flex-col items-center justify-between text-center border shadow-sm ${isUp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{interval}</div>
                          <div className={`text-xl font-bold my-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {pred.prediction}
                          </div>
                          <div className={`mt-1 mb-1 text-[13px] font-extrabold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {(pred.confidence * 100).toFixed(1)}% Conf
                          </div>
                          <div className="text-[11px] text-gray-600 font-medium">
                            {pred.target_time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <PredictionCard prediction={prediction} />
              

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
