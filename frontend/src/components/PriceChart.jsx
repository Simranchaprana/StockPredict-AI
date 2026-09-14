import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  // Format the dates for display
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  // Calculate min and max for better Y-axis scaling
  const prices = data.map(d => d.close);
  const min = Math.min(...prices) * 0.95;
  const max = Math.max(...prices) * 1.05;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="formattedDate" 
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
          <Tooltip 
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return new Date(payload[0].payload.date).toLocaleDateString();
              }
              return label;
            }}
            formatter={(value) => [`₹${value.toFixed(2)}`, 'Close Price']}
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
