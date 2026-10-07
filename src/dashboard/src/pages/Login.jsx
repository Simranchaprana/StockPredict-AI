import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ setAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isLogin) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.username);
        setAuth(true);
        navigate('/');
      } else {
        setIsLogin(true);
        setError('Registration successful! Please log in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            StockPredict AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        
        {error && (
          <div className={`p-3 text-sm rounded ${error.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="sr-only">Username</label>
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only">Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
