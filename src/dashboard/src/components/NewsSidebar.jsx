import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function NewsSidebar({ symbol }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/news/${symbol}`);
        setNews(response.data);
      } catch (err) {
        console.error("Failed to load news", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [symbol]);

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Latest Headlines
        </h3>
        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">LIVE</span>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No recent news available.</p>
      ) : (
        <div className="space-y-4 divide-y divide-gray-100">
          {news.map((item, idx) => (
            <div key={idx} className={idx > 0 ? "pt-4" : ""}>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="group">
                <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.title}
                </h4>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span className="font-medium text-gray-600">{item.publisher}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(item.time * 1000).toLocaleDateString()}</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
