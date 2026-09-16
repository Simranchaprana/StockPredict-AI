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

  // Format the dates for display
  const chartData = data.map(item => {
    const d = new Date(item.date);
    const isDaily = item.date.endsWith('00:00:00');
    return {
      ...item,
      formattedDate: isDaily 
        ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      tooltipDate: d.toLocaleString()
    };
  });

  // Calculate min and max for better Y-axis scaling
  const prices = data.flatMap(d => [d.close, d.open].filter(Boolean));
  const min = Math.min(...prices) * 0.95;
  const max = Math.max(...prices) * 1.05;

  return (
    <div className="h-96 w-full mt-4">
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
                return payload[0].payload.tooltipDate;
              }
              return label;
            }}
            formatter={(value, name) => [`₹${value.toFixed(2)}`, name === 'close' ? 'Close Price' : 'Open Price']}
          />
          <Legend verticalAlign="top" height={36}/>
          <Line 
            name="open"
            type="monotone" 
            dataKey="open" 
            stroke="#94a3b8" 
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line 
            name="close"
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
