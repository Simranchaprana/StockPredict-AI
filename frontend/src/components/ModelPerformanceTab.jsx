import React from 'react';

export default function ModelPerformanceTab({ performance }) {
  if (!performance) return <p className="text-gray-500">No performance data available.</p>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Random Forest Classifier</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Accuracy</span><span className="font-medium">{(performance['Random Forest'].accuracy * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Precision</span><span className="font-medium">{performance['Random Forest'].precision.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Recall</span><span className="font-medium">{performance['Random Forest'].recall.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">F1 Score</span><span className="font-medium">{performance['Random Forest'].f1.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">ROC-AUC</span><span className="font-medium">{performance['Random Forest'].roc_auc ? performance['Random Forest'].roc_auc.toFixed(2) : 'N/A'}</span></div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Logistic Regression</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Accuracy</span><span className="font-medium">{(performance['Logistic Regression'].accuracy * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Precision</span><span className="font-medium">{performance['Logistic Regression'].precision.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Recall</span><span className="font-medium">{performance['Logistic Regression'].recall.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">F1 Score</span><span className="font-medium">{performance['Logistic Regression'].f1.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">ROC-AUC</span><span className="font-medium">{performance['Logistic Regression'].roc_auc ? performance['Logistic Regression'].roc_auc.toFixed(2) : 'N/A'}</span></div>
          </div>
        </div>
      </div>

      <hr className="my-6 border-gray-200" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Regressor (Gradient Boosting)</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Mean Absolute Error (MAE)</span>
              <span className="font-medium">₹{performance.Regressor.mae.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">R² Score</span>
              <span className="font-medium">{performance.Regressor.r2.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Backtest Result (1-Fold)</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-semibold">Strategy Return</span>
              <span className={`font-bold ${performance.Backtest.strategy_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performance.Backtest.strategy_return?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Sharpe Ratio</span>
              <span className={`font-medium ${performance.Backtest.strategy_sharpe >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                {performance.Backtest.strategy_sharpe?.toFixed(2)}
              </span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-semibold">Buy & Hold Return</span>
                <span className={`font-bold ${performance.Backtest.buy_and_hold_return >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {performance.Backtest.buy_and_hold_return?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
