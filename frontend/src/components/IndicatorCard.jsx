import React from 'react';

export default function IndicatorCard({ indicators }) {
  if (!indicators) return null;

  const StatBox = ({ label, value, badge }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-between h-full">
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      <div className="mt-1 flex items-baseline justify-between">
        <p className="text-xl font-semibold text-gray-900">
          {value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : 'N/A'}
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
    <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
        Technical Indicators (Latest)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox 
          label="RSI (14)" 
          value={indicators.RSI} 
          badge={{
            text: indicators.RSI > 70 ? 'Overbought' : indicators.RSI < 30 ? 'Oversold' : 'Neutral',
            color: indicators.RSI > 70 ? 'bg-red-100 text-red-800' : indicators.RSI < 30 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
          }}
        />
        <StatBox 
          label="MACD" 
          value={indicators.MACD}
          badge={{
            text: indicators.MACD > 0 ? 'Bullish' : 'Bearish',
            color: indicators.MACD > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }}
        />
        <StatBox 
          label="SMA (20)" 
          value={indicators.SMA_20} 
        />
        <StatBox 
          label="SMA (200)" 
          value={indicators.SMA_200} 
          badge={{ text: 'Long Trend', color: 'bg-blue-100 text-blue-800' }}
        />
        <StatBox 
          label="EMA (20)" 
          value={indicators.EMA_20} 
        />
        <StatBox 
          label="EMA (50)" 
          value={indicators.EMA_50} 
        />
        <StatBox 
          label="BB Upper" 
          value={indicators.BB_Upper} 
        />
        <StatBox 
          label="BB Lower" 
          value={indicators.BB_Lower} 
        />
      </div>
    </div>
  );
}
