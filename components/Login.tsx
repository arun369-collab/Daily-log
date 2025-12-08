
import React, { useState } from 'react';
import { Lock, User, Factory, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, username?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hardcoded credentials check
    const user = username.toLowerCase().trim();
    const pass = password.trim();

    if (user === 'universe' && pass === 'universe') {
      onLogin('admin', 'Admin');
    } else if (user === 'yadav' && pass === 'yadav') {
      onLogin('yadav', 'Yadav');
    } else if (user === 'asim' && pass === 'asim') {
      onLogin('sales', 'Asim');
    } 
    // Additional Sales Staff (Generic password '1234')
    else if (['arshad', 'ahmed', 'tharwat'].includes(user) && pass === '1234') {
       // Convert input 'arshad' -> 'Arshad' for display
       const displayName = username.charAt(0).toUpperCase() + username.slice(1);
       onLogin('sales', displayName);
    }
    else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-10 text-center">
          <div className="inline-flex p-4 bg-white/10 rounded-full mb-4">
            <Factory className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">FactoryFlow</h1>
          <p className="text-blue-100">Production Coordinator Portal</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              Login <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
