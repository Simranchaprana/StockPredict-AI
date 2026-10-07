import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function PredictionCard({ prediction, title = "Next-Day Prediction (AI Model)" }) {
  if (!prediction) return null;

  if (prediction.error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div>
          <h4 className="text-red-800 font-medium">Prediction Error</h4>
          <p className="text-red-600 text-sm">{prediction.error}</p>
        </div>
      </div>
    );
  }

  const isBuy = prediction.prediction === 'BUY';
  const isSell = prediction.prediction === 'SELL';
  const isHold = prediction.prediction === 'HOLD';
  const confidencePct = (prediction.confidence * 100).toFixed(1);

  let dirColor = 'text-gray-500';
  let barColor = 'bg-gray-400';
  let DirIcon = AlertCircle;
  if (isBuy) {
    dirColor = 'text-green-600';
    barColor = 'bg-green-500';
    DirIcon = TrendingUp;
  } else if (isSell) {
    dirColor = 'text-red-600';
    barColor = 'bg-red-500';
    DirIcon = TrendingDown;
  }


  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
      <div className="px-6 py-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Predicting for <span className="font-bold text-gray-800">{prediction.target_date}</span> based on {prediction.latest_data_date} data.
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Direction</p>
            <div className={`mt-1 flex items-center text-3xl font-bold ${dirColor}`}>
              <DirIcon className="w-8 h-8 mr-2" />
              {prediction.prediction}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Estimated Price</p>
            <div className="mt-1 text-3xl font-bold text-gray-900">
              ₹{prediction.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Confidence Score</span>
            <span className="text-sm font-medium text-gray-900">{confidencePct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${barColor}`} 
              style={{ width: `${confidencePct}%` }}
            ></div>
          </div>
        </div>

        {prediction.predicted_price && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            {prediction.models_agree ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ✓ Price momentum supports direction
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                ↹ Divergent price signal
              </span>
            )}
          </div>
        )}
        
        {!prediction.models_agree && prediction.warning && (
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
            <strong>Analyst Note:</strong> The primary classifier detects an {prediction.prediction} pattern, but the secondary price regressor estimates a target of ₹{prediction.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}, suggesting potential volatility.
          </div>
        )}
        
        {prediction.shap_values && (prediction.shap_values.positive_drivers?.length > 0 || prediction.shap_values.negative_drivers?.length > 0) ? (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Explainable AI (SHAP Drivers)</h4>
            <p className="text-xs text-gray-500 mb-3">What pushed the model towards {prediction.prediction}:</p>
            <div className="space-y-4">
              {prediction.shap_values.positive_drivers?.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Bullish Factors</h5>
                  <div className="space-y-1">
                    {prediction.shap_values.positive_drivers.map((driver) => (
                      <div key={driver.feature} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 truncate">{driver.feature}</span>
                        <div className="flex items-center">
                           <div className="w-16 bg-gray-100 rounded-full h-1 mr-2 flex justify-end">
                             <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min(100, driver.impact * 1500)}%` }}></div>
                           </div>
                           <span className="text-green-600 font-mono text-[10px]">+{driver.impact.toFixed(3)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {prediction.shap_values.negative_drivers?.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Bearish Factors</h5>
                  <div className="space-y-1">
                    {prediction.shap_values.negative_drivers.map((driver) => (
                      <div key={driver.feature} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 truncate">{driver.feature}</span>
                        <div className="flex items-center">
                           <div className="w-16 bg-gray-100 rounded-full h-1 mr-2 flex justify-start">
                             <div className="bg-red-500 h-1 rounded-full" style={{ width: `${Math.min(100, Math.abs(driver.impact) * 1500)}%` }}></div>
                           </div>
                           <span className="text-red-600 font-mono text-[10px]">{driver.impact.toFixed(3)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : prediction.feature_importances && Object.keys(prediction.feature_importances).length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Model Diagnostics</h4>
            <p className="text-xs text-gray-500 mb-2">Top driving features for this prediction (XGBoost Split Importance):</p>
            <div className="space-y-2">
              {Object.entries(prediction.feature_importances).map(([feature, importance]) => (
                <div key={feature} className="flex items-center text-xs">
                  <span className="w-1/2 text-gray-600 truncate pr-2">{feature}</span>
                  <div className="w-1/2 bg-gray-200 rounded-full h-1.5 flex-1 mx-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, importance * 500)}%` }}></div>
                  </div>
                  <span className="text-gray-500 font-mono text-right w-8">{(importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400 text-center">
          Predictions do not constitute financial advice.
        </p>
      </div>
    </div>
  );
}
