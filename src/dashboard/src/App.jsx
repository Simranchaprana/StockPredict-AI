import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (isChecking) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center py-4">
                  <span className="text-2xl font-extrabold text-blue-600 tracking-tight">StockPredict AI</span>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-4">
                  Hi, {localStorage.getItem('username')}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" /> : <Login setAuth={setIsAuthenticated} />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
