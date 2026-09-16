import React, { useState } from 'react';
import IndicatorCard from './IndicatorCard';
import PredictionHistoryTab from './PredictionHistoryTab';
import ModelPerformanceTab from './ModelPerformanceTab';

export default function DashboardTabs({ indicators, performance, predictionLogs }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['Technical Indicators', 'Model Performance', 'Prediction History'];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 mt-6 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex -mb-px px-2" aria-label="Tabs">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === idx
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-0">
        {activeTab === 0 && (
          <div className="p-4">
            <IndicatorCard indicators={indicators} />
          </div>
        )}
        {activeTab === 1 && (
          <div className="p-6">
            <ModelPerformanceTab performance={performance} />
          </div>
        )}
        {activeTab === 2 && (
          <div className="p-6">
            <PredictionHistoryTab logs={predictionLogs} />
          </div>
        )}
      </div>
    </div>
  );
}
