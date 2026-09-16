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

  const fetchStockData = async (sym, period = chartPeriod, background = false) => {
    if (!background) {
      setLoading(true);
      setError(null);
    }
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
      if (!background) {
        setError(err.response?.data?.detail || "Failed to fetch stock data.");
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStockData(symbol, chartPeriod);
    
    // Set up real-time polling every 60 seconds (silent background refresh)
    const intervalId = setInterval(() => {
      fetchStockData(symbol, chartPeriod, true);
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [symbol, chartPeriod]);

  const handleSearch = (newSymbol) => {
    setSymbol(newSymbol);
  };

  const handlePeriodChange = (period) => {
    setChartPeriod(period);
  };

  const isMarketClosed = React.useMemo(() => {
    if (!history || history.length === 0) return false;
    const lastDate = new Date(history[history.length - 1].date);
    const now = new Date();
    // Assume market is closed if the latest tick is > 30 minutes old
    return (now - lastDate) > 30 * 60 * 1000;
  }, [history]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-blue-600">StockPredict AI</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="mb-6">
          <div className="max-w-lg mx-auto">
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{stockInfo?.symbol || symbol}</h2>
                  {stockInfo && (
                    <div className="flex items-center mt-1">
                      <span className="text-3xl font-black mr-3">₹{stockInfo.price.toFixed(2)}</span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${stockInfo.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {stockInfo.change >= 0 ? '+' : ''}{stockInfo.change.toFixed(2)} ({stockInfo.pct_change.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  {['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'].map(p => (
                    <button
                      key={p}
                      onClick={() => handlePeriodChange(p)}
                      className={`px-3 py-1 text-xs font-medium rounded ${chartPeriod === p ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              <PriceChart data={history} />
            </div>

            <DashboardTabs 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              indicators={indicators}
              performance={performance}
              predictionLogs={predictionLogs}
            />
          </div>

          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {intradayPredictions && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                  <div className="mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">
                      Today's Prediction (Live Scalping)
                    </h3>
                    <div className="text-sm text-gray-500 flex justify-between mt-2">
                      <span>High-frequency signals</span>
                      {!isMarketClosed && (
                        <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {intradayPredictions['5min']?.latest_time || ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isMarketClosed ? (
                    <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600">Market is currently closed</p>
                      <p className="text-xs text-gray-500 mt-1">Live scalping predictions will resume when trading opens.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {['5min', '8min', '10min'].map(interval => {
                        const pred = intradayPredictions[interval];
                        if (!pred || pred.error) return null;
                        const isUp = pred.prediction === 'UP';
                        return (
                          <div key={interval} className="p-3 rounded-lg flex flex-col items-center justify-between text-center border border-gray-100 bg-white shadow-sm">
                            <div className="flex flex-col items-center mb-1">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{interval}</span>
                              <span className="text-[10px] font-medium text-gray-500">Until {pred.target_time}</span>
                            </div>
                            <div className={`text-xl font-bold my-1 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                              {pred.prediction}
                            </div>
                            <div className={`mt-1 text-[12px] font-semibold ${isUp ? 'text-green-600' : 'text-gray-500'}`}>
                              {(pred.confidence * 100).toFixed(1)}% Conf
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              <PredictionCard prediction={prediction} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
