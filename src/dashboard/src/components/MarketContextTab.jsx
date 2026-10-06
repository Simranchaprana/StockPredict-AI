import React from 'react';

export default function MarketContextTab({ indicators }) {
  if (!indicators) return null;

  const getSentimentBadge = (score) => {
    if (score == null) return null;
    if (score > 0.1) return { text: 'Positive', color: 'bg-green-100 text-green-800' };
    if (score < -0.1) return { text: 'Negative', color: 'bg-red-100 text-red-800' };
    return { text: 'Neutral', color: 'bg-gray-100 text-gray-800' };
  };

  const getReturnBadge = (val) => {
    if (val == null) return null;
    if (val > 0) return { text: 'Up', color: 'bg-green-100 text-green-800' };
    if (val < 0) return { text: 'Down', color: 'bg-red-100 text-red-800' };
    return { text: 'Flat', color: 'bg-gray-100 text-gray-800' };
  };

  const StatBox = ({ label, value, badge, isPct }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-between h-full">
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      <div className="mt-1 flex items-baseline justify-between">
        <p className="text-xl font-semibold text-gray-900">
          {value != null 
            ? (typeof value === 'number' 
                ? (isPct ? (value * 100).toFixed(2) + '%' : value.toFixed(3)) 
                : value) 
            : 'N/A'}
        </p>
        {badge && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Financial News Sentiment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatBox 
            label="Daily News Sentiment Score (-1 to 1)" 
            value={indicators.Sentiment_Score} 
            badge={getSentimentBadge(indicators.Sentiment_Score)}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Market Context (Latest Day)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox 
            label="Broad Index Return" 
            value={indicators.Broad_Index_Return} 
            badge={getReturnBadge(indicators.Broad_Index_Return)}
            isPct={true}
          />
          <StatBox 
            label="Sector Index Return" 
            value={indicators.Sector_Index_Return} 
            badge={getReturnBadge(indicators.Sector_Index_Return)}
            isPct={true}
          />
          <StatBox 
            label="VIX (Volatility) Level" 
            value={indicators.VIX_Close} 
          />
          <StatBox 
            label="FX Rate Return" 
            value={indicators.FX_Return} 
            badge={getReturnBadge(indicators.FX_Return)}
            isPct={true}
          />
        </div>
      </div>
    </div>
  );
}
