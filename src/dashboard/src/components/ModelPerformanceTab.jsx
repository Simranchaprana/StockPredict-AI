import React from 'react';

export default function ModelPerformanceTab({ performance }) {
  if (!performance) return <p className="text-gray-500">No performance data available.</p>;

  const models = ['XGBoost', 'Random Forest', 'Logistic Regression'];
  let bestModelName = models[0];
  let bestScore = 0;
  
  models.forEach(model => {
    if (performance[model]) {
      const score = performance[model].trade_accuracy || performance[model].accuracy;
      if (score > bestScore) {
        bestScore = score;
        bestModelName = model;
      }
    }
  });

  const bestModel = performance[bestModelName] || {};

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Directional Classification (Best Model)</h3>
        <p className="text-xs text-gray-500 mb-4">Displaying metrics for the highest accuracy model: <strong className="text-blue-600">{bestModelName}</strong></p>
        
        {bestModel.verdict && (
          <div className={`mb-4 p-3 rounded border text-sm font-medium ${
            bestModel.verdict.includes('Significant') ? 'bg-green-50 border-green-200 text-green-800' :
            bestModel.verdict.includes('Weak Edge') ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span className="font-bold uppercase text-xs mr-2 border-r pr-2 border-current opacity-70">Reality Check</span> 
            {bestModel.verdict} 
            {bestModel.p_value !== undefined && <span className="ml-2 opacity-75 font-mono text-xs">(p={bestModel.p_value.toFixed(3)})</span>}
          </div>
        )}

        <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-100">
            {bestModel.trade_accuracy && (
              <div className="p-4 flex flex-col items-center justify-center bg-green-50/30">
                <span className="text-xs text-gray-500 font-medium mb-1 text-center">Trade Acc. (High Conf.)</span>
                <span className="text-xl font-bold text-green-700">{(bestModel.trade_accuracy * 100).toFixed(1)}%</span>
              </div>
            )}
            <div className="p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Base Accuracy</span>
              <span className="text-xl font-bold text-blue-700">{bestModel.accuracy ? (bestModel.accuracy * 100).toFixed(1) : '0'}%</span>
            </div>
            {bestModel.balanced_accuracy && (
            <div className="p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Balanced Acc.</span>
              <span className="text-xl font-bold text-blue-700">{(bestModel.balanced_accuracy * 100).toFixed(1)}%</span>
            </div>
            )}
            {bestModel.majority_baseline && (
            <div className="p-4 flex flex-col items-center justify-center bg-yellow-50/30">
              <span className="text-xs text-gray-500 font-medium mb-1">Majority Baseline</span>
              <span className="text-xl font-bold text-yellow-700">{(bestModel.majority_baseline * 100).toFixed(1)}%</span>
            </div>
            )}
            <div className="p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Precision</span>
              <span className="text-xl font-bold text-gray-800">{bestModel.precision ? bestModel.precision.toFixed(2) : '0'}</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Recall</span>
              <span className="text-xl font-bold text-gray-800">{bestModel.recall ? bestModel.recall.toFixed(2) : '0'}</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">F1 Score</span>
              <span className="text-xl font-bold text-gray-800">{bestModel.f1 ? bestModel.f1.toFixed(2) : '0'}</span>
            </div>
            {bestModel.mcc !== undefined && (
            <div className="p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">MCC</span>
              <span className="text-xl font-bold text-purple-700">{bestModel.mcc.toFixed(2)}</span>
            </div>
            )}
            <div className="p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">ROC-AUC</span>
              <span className="text-xl font-bold text-gray-800">{bestModel.roc_auc ? bestModel.roc_auc.toFixed(2) : 'N/A'}</span>
            </div>
          </div>
        </div>
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
              <span className="text-gray-600">CAGR</span>
              <span className="font-medium text-gray-800">{performance.Backtest.strategy_cagr?.toFixed(1)}%</span>
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
                <span className="text-gray-600">CAGR</span>
                <span className="font-medium text-gray-800">{performance.Backtest.buy_and_hold_cagr?.toFixed(1)}%</span>
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
