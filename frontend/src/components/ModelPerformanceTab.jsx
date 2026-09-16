import React from 'react';

export default function ModelPerformanceTab({ performance }) {
  if (!performance) return <p className="text-gray-500">No performance data available.</p>;

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Classification Metric</th>
              <th className="px-4 py-3 text-center font-semibold text-blue-700 bg-blue-50">Random Forest</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Logistic Regression</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">Accuracy</td>
              <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{(performance['Random Forest'].accuracy * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-center text-gray-600">{(performance['Logistic Regression'].accuracy * 100).toFixed(1)}%</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">Precision</td>
              <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance['Random Forest'].precision.toFixed(2)}</td>
              <td className="px-4 py-3 text-center text-gray-600">{performance['Logistic Regression'].precision.toFixed(2)}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">Recall</td>
              <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance['Random Forest'].recall.toFixed(2)}</td>
              <td className="px-4 py-3 text-center text-gray-600">{performance['Logistic Regression'].recall.toFixed(2)}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">F1 Score</td>
              <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance['Random Forest'].f1.toFixed(2)}</td>
              <td className="px-4 py-3 text-center text-gray-600">{performance['Logistic Regression'].f1.toFixed(2)}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">ROC-AUC</td>
              <td className="px-4 py-3 text-center font-medium bg-blue-50/30">{performance['Random Forest'].roc_auc ? performance['Random Forest'].roc_auc.toFixed(2) : 'N/A'}</td>
              <td className="px-4 py-3 text-center text-gray-600">{performance['Logistic Regression'].roc_auc ? performance['Logistic Regression'].roc_auc.toFixed(2) : 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Price Regressor</h3>
          <p className="text-xs text-gray-500 mb-4">Gradient Boosting evaluation for exact price estimation.</p>
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 font-medium">Mean Absolute Error (MAE)</span>
              <span className="font-bold text-gray-900">₹{performance.Regressor.mae.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 font-medium">R² Score</span>
              <span className="font-bold text-gray-900">{performance.Regressor.r2.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Backtest Result (1-Fold)</h3>
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-semibold">Strategy Return</span>
              <span className={`font-bold ${performance.Backtest.strategy_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performance.Backtest.strategy_return?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Sharpe Ratio</span>
              <span className={`font-medium ${performance.Backtest.strategy_sharpe >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {performance.Backtest.strategy_sharpe?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Max Drawdown</span>
              <span className="font-medium text-red-600">{performance.Backtest.strategy_max_dd?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Win Rate</span>
              <span className="font-medium text-gray-800">{performance.Backtest.strategy_win_rate?.toFixed(1)}%</span>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-semibold">Buy & Hold Return</span>
                <span className={`font-bold ${performance.Backtest.buy_and_hold_return >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {performance.Backtest.buy_and_hold_return?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Sharpe Ratio</span>
                <span className={`font-medium ${performance.Backtest.buy_and_hold_sharpe >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                  {performance.Backtest.buy_and_hold_sharpe?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Max Drawdown</span>
                <span className="font-medium text-red-600">{performance.Backtest.buy_and_hold_max_dd?.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
