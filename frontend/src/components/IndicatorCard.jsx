import React from 'react';

export default function IndicatorCard({ indicators }) {
  if (!indicators) return null;

  const StatBox = ({ label, value, description }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">
        {value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : 'N/A'}
      </p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
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
          description={indicators.RSI > 70 ? 'Overbought' : indicators.RSI < 30 ? 'Oversold' : 'Neutral'}
        />
        <StatBox 
          label="MACD" 
          value={indicators.MACD} 
        />
        <StatBox 
          label="SMA (20)" 
          value={indicators.SMA_20} 
        />
        <StatBox 
          label="SMA (200)" 
          value={indicators.SMA_200} 
          description="Long-term trend"
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
