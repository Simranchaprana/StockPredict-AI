import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';

export default function PriceChart({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  // Determine if dataset is purely daily (all times are 00:00:00 or midnight)
  // If even one row has a non-midnight time, it's intraday
  const isIntraday = data.some(item => !item.date.includes('00:00:00'));

  // Format the dates for display
  const chartData = data.map(item => {
    const d = new Date(item.date);
    
    // For X-Axis: if intraday, show time only (e.g. 14:35). If daily, show date only (e.g. Sep 16).
    const xAxisLabel = isIntraday 
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
    const tooltipDate = d.toLocaleDateString();
    const tooltipTime = isIntraday
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : "15:30";

    return {
      ...item,
      xAxisLabel,
      tooltipDate,
      tooltipTime,
    };
  });

  const prices = data.map(d => d.close);
  const min = Math.min(...prices) * 0.95;
  const max = Math.max(...prices) * 1.05;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isEOD = dataPoint.tooltipTime === "15:30";
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {dataPoint.tooltipDate} <span className="text-blue-600 font-bold ml-1">{dataPoint.tooltipTime}</span>
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Opening Rate: <span className="font-medium text-gray-900">₹{dataPoint.open?.toFixed(2)}</span>
            </p>
            <p className="text-sm text-blue-600 font-semibold">
              {isEOD ? `Closing Rate:` : `Timely Rate:`} <span className="font-bold">₹{dataPoint.close?.toFixed(2)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="xAxisLabel" 
          tick={{ fontSize: 12 }} 
          tickMargin={10}
          minTickGap={30}
        />
        <YAxis 
          domain={[min, max]} 
          tickFormatter={(val) => val.toFixed(0)}
          tick={{ fontSize: 12 }}
          orientation="right"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          name="Timely Rate"
          type="monotone" 
          dataKey="close" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={false}
          activeDot={false}
        />
        <Brush dataKey="xAxisLabel" height={30} stroke="#3b82f6" fill="#f3f4f6" travellerWidth={10} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (isExpanded) {
    return (
      <>
        {/* Render placeholder inline to keep layout stable */}
        <div className="h-[450px] w-full mt-4 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200 text-gray-400">
          Chart expanded in full screen mode...
        </div>
        
        {/* Full-screen overlay */}
        <div 
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm p-4 sm:p-8 flex flex-col"
          onDoubleClick={() => setIsExpanded(false)}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Expanded Chart View
            </h3>
            <button 
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Close / Double-click anywhere
            </button>
          </div>
          <div className="flex-1 w-full bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            {chartContent}
          </div>
        </div>
      </>
    );
  }

  return (
    <div 
      className="h-[450px] w-full mt-4 cursor-pointer relative group"
      onDoubleClick={() => setIsExpanded(true)}
    >
      <div className="absolute inset-0 z-10 pointer-events-none rounded border-2 border-transparent group-hover:border-blue-200 transition-colors">
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-500 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity flex items-center shadow-sm">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          Double-click to expand
        </div>
      </div>
      {chartContent}
    </div>
  );
}
