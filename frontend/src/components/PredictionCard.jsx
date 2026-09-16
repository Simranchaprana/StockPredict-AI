import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function PredictionCard({ prediction, title = "Next-Day Prediction (AI Model)", intraday = null }) {
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

  const isUp = prediction.prediction === 'UP';
  const confidencePct = (prediction.confidence * 100).toFixed(1);

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
            <div className={`mt-1 flex items-center text-3xl font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? <TrendingUp className="w-8 h-8 mr-2" /> : <TrendingDown className="w-8 h-8 mr-2" />}
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
              className={`h-2.5 rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`} 
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

        {intraday && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wide">High-Frequency Scalping (Live)</h4>
            <div className="grid grid-cols-3 gap-2">
              {['5min', '8min', '10min'].map(interval => {
                const pred = intraday[interval];
                if (!pred || pred.error) return null;
                const isPredUp = pred.prediction === 'UP';
                return (
                  <div key={interval} className={`p-2 rounded text-center border ${isPredUp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-[10px] font-semibold text-gray-500 mb-1">{interval}</div>
                    <div className={`text-sm font-bold ${isPredUp ? 'text-green-700' : 'text-red-700'}`}>
                      {pred.prediction}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">
                      {pred.target_time} ({(pred.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-4 text-[10px] text-gray-400 text-center">
          Predictions do not constitute financial advice.
        </p>
      </div>
    </div>
  );
}
