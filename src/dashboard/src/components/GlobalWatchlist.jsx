import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function GlobalWatchlist({ onSelectSymbol, type = "macro", title = "Global Macro Command Centre" }) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/watchlist?type=${type}`);
        setWatchlist(response.data);
      } catch (err) {
        console.error(`Failed to load ${type} watchlist`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [type]);

  if (loading) {
    return (
      <div className="flex space-x-4 animate-pulse overflow-x-hidden mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 w-48 bg-white border border-gray-100 rounded-lg shadow-sm flex-shrink-0"></div>
        ))}
      </div>
    );
  }

  if (!watchlist || watchlist.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">{title}</h2>
      <div className="flex overflow-x-auto pb-4 space-x-4 hide-scrollbar cursor-pointer">
        {watchlist.map((item) => (
          <div 
            key={item.symbol} 
            onClick={() => onSelectSymbol(item.symbol)}
            className="flex-shrink-0 w-48 bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-900 truncate">{item.name}</span>
            </div>
            <div className="text-lg font-black text-gray-800 mb-1">
              {item.symbol === 'BTC-USD' || item.symbol === 'DX-Y.NYB' ? '$' : item.symbol === 'GC=F' || item.symbol === 'CL=F' || item.symbol === 'SPY' || item.symbol === 'EURUSD=X' ? '$' : item.symbol === '^TNX' || item.symbol === '^VIX' ? '' : '₹'}
              {item.price.toFixed(2)}{item.symbol === '^TNX' || item.symbol === '^VIX' ? '%' : ''}
            </div>
            <div className={`text-xs font-bold ${item.isUp ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {item.isUp ? (
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              )}
              {item.change > 0 ? '+' : ''}{item.change.toFixed(2)} ({item.pct_change.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
