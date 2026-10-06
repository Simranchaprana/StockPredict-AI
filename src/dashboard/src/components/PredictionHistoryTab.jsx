import React from 'react';

export default function PredictionHistoryTab({ logs }) {
  if (!logs || logs.length === 0) return <p className="text-gray-500">No prediction history available.</p>;

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">Date & Time</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">Prediction</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">Estimated Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                {new Date(log.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className={`whitespace-nowrap px-3 py-3 text-sm font-bold ${log.prediction_direction === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                {log.prediction_direction}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700 font-medium">
                ₹{log.predicted_price.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
