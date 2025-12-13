
import React, { useState } from 'react';
import { Database, CheckCircle, LogOut, RefreshCw, Cloud } from 'lucide-react';
import { syncDown, syncUp, getProjectId } from '../services/syncService';

interface SettingsProps {
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    const success = await syncDown();
    if (success) {
        setSyncStatus('success');
    } else {
        setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleForcePush = async () => {
     if(window.confirm("This will overwrite the cloud database with your current local data. Are you sure?")) {
        setSyncStatus('syncing');
        const success = await syncUp();
        if (success) {
            setSyncStatus('success');
        } else {
            setSyncStatus('error');
        }
        setTimeout(() => setSyncStatus('idle'), 2000);
     }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cloud Database</h2>
            <p className="text-gray-500 text-sm">Real-time data synchronization</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-6">
            <CheckCircle className="text-green-600" size={20} />
            <div>
                <p className="text-sm font-bold text-green-800">System Online</p>
                <p className="text-xs text-green-600">Connected to Firebase Project: <span className="font-mono">{getProjectId()}</span></p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
             >
                <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now (Pull)'}
             </button>

             <button
                onClick={handleForcePush}
                disabled={syncStatus === 'syncing'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
             >
                <Cloud size={18} />
                Force Backup (Push)
             </button>
        </div>
        
        {syncStatus === 'success' && <p className="text-center text-xs text-green-600 mt-2 font-bold">Operation Completed Successfully!</p>}
        {syncStatus === 'error' && <p className="text-center text-xs text-red-600 mt-2 font-bold">Connection Failed. Check internet or console.</p>}

      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <h2 className="text-lg font-bold text-gray-800 mb-4">Account</h2>
         <button
            onClick={onLogout}
            className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all bg-red-50 text-red-600 hover:bg-red-100"
           >
             <LogOut size={20} />
             Sign Out
           </button>
      </div>
    </div>
  );
};
