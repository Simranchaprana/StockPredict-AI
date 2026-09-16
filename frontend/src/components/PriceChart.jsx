import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PriceChart({ data }) {
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
      : "End of Day (Close)";

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
      const isEOD = dataPoint.tooltipTime === "End of Day (Close)";
      
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

  return (
    <div className="h-96 w-full mt-4">
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
