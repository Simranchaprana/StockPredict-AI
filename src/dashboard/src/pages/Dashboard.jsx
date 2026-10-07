import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PriceChart from '../components/PriceChart';
import IndicatorCard from '../components/IndicatorCard';
import PredictionCard from '../components/PredictionCard';
import StockSearch from '../components/StockSearch';
import DashboardTabs from '../components/DashboardTabs';
import GlobalWatchlist from '../components/GlobalWatchlist';
import NewsSidebar from '../components/NewsSidebar';

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
        const predResponse = await axios.get(`${API_BASE}/predict/${sym}`);
        const nextDayData = predResponse.data.next_day_prediction;
        if (nextDayData && predResponse.data.feature_importances) {
          nextDayData.feature_importances = predResponse.data.feature_importances;
        }
        setPrediction(nextDayData);
        setTodayPrediction(predResponse.data.today_prediction);
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

  const isMarketClosed = React.useMemo(() => {
    if (!history || history.length === 0) return false;
    const lastDate = new Date(history[history.length - 1].date);
    const now = new Date();
    // Assume market is closed if the latest tick is > 30 minutes old
    return (now - lastDate) > 30 * 60 * 1000;
  }, [history]);

  const isClosedRef = React.useRef(isMarketClosed);
  useEffect(() => {
    isClosedRef.current = isMarketClosed;
  }, [isMarketClosed]);

  useEffect(() => {
    fetchStockData(symbol, chartPeriod);
    
    // Set up real-time polling every 60 seconds (silent background refresh)
    const intervalId = setInterval(() => {
      // SMART POLLING: If market is closed, don't waste bandwidth polling every 60s
      if (isClosedRef.current) {
        console.log("Market is closed. Skipping heavy background poll.");
        return;
      }
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
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

        <GlobalWatchlist onSelectSymbol={handleSearch} type="macro" title="Global Macro Command Centre" />
        <GlobalWatchlist onSelectSymbol={handleSearch} type="forex_bonds" title="Forex & Bonds Command Centre" />

        {/* Market Status Banner */}
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between border ${isMarketClosed ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${isMarketClosed ? 'bg-orange-500' : 'bg-green-500 animate-pulse'}`}></div>
            <div>
              <h3 className={`font-bold ${isMarketClosed ? 'text-orange-800' : 'text-green-800'}`}>
                {isMarketClosed ? 'Market is Currently Closed' : 'Market is Open & Trading'}
              </h3>
              <p className={`text-sm ${isMarketClosed ? 'text-orange-700' : 'text-green-700'}`}>
                {isMarketClosed ? 'All predictions are finalized for the next trading session.' : 'Live scalping predictions are actively updating.'}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isMarketClosed ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
              {isMarketClosed ? 'Next Open: 9:15 AM IST (NSE) / 7:00 PM IST (NYSE)' : 'Real-Time Sync Active'}
            </span>
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
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center mb-4">
                        <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h4 className="text-md font-bold text-indigo-900">End-of-Day Review Mode</h4>
                      </div>
                      <p className="text-sm text-indigo-800 mb-4">
                        The live scalping model is offline. Below is the historical tracking of the model's overnight prediction accuracy for {symbol}.
                      </p>
                      
                      {predictionLogs && predictionLogs.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-200 pb-1 mb-2">Recent Prediction Logs</div>
                          {predictionLogs.slice(0, 3).map((log, i) => {
                            // Determine accuracy if possible
                            const wasRight = log.actual_direction === log.predicted_direction;
                            return (
                              <div key={i} className="flex justify-between items-center bg-white p-2 rounded shadow-sm text-xs">
                                <span className="font-medium text-gray-600">{log.prediction_date}</span>
                                <div>
                                  <span className="text-gray-500 mr-2">Predicted: <strong className={log.predicted_direction === 'UP' ? 'text-green-600' : 'text-red-600'}>{log.predicted_direction}</strong></span>
                                  {log.actual_direction && (
                                    <span className={`px-2 py-0.5 rounded font-bold ${wasRight ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {wasRight ? 'CORRECT' : 'WRONG'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-indigo-600 italic">No historical logs available for this ticker yet.</div>
                      )}
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
              <NewsSidebar symbol={symbol} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
