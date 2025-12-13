
import React, { useState, useEffect } from 'react';
import { Save, Database, CheckCircle, HelpCircle, LogOut, Terminal } from 'lucide-react';
import { getSyncConfig, saveSyncConfig, syncDown } from '../services/syncService';

interface SettingsProps {
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [config, setConfig] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing config
    const existing = getSyncConfig();
    if (existing) {
        // Pretty print it for display if it's valid JSON
        try {
            setConfig(JSON.stringify(JSON.parse(existing), null, 2));
        } catch(e) {
            setConfig(existing);
        }
    }
  }, []);

  const handleSave = () => {
    try {
        // Validate JSON
        const cleanStr = config.replace(/const\s+\w+\s*=\s*/, '').replace(/;$/, '');
        JSON.parse(cleanStr);
        
        saveSyncConfig(cleanStr);
        setSaved(true);
        setError('');
        
        // Try to sync immediately
        syncDown().then((success) => {
            if(!success) setError("Config saved, but connection failed. Check Console for details.");
        });

        setTimeout(() => setSaved(false), 2000);
    } catch (e) {
        setError("Invalid JSON format. Please ensure you copied the object correctly.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Firebase Cloud Database</h2>
            <p className="text-gray-500 text-sm">Connect to Google Firebase for robust, real-time sync.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firebase Config Object
            </label>
            <div className="relative">
                <textarea
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder={'{ "apiKey": "...", "authDomain": "...", ... }'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono text-gray-600 h-48"
                />
                <Terminal className="absolute top-3 right-3 text-gray-300" size={16} />
            </div>
            {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {saved ? <><CheckCircle size={18} /> Settings Saved & Synced</> : <><Save size={18} /> Save Connection</>}
          </button>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-5 border border-blue-100">
          <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
            <HelpCircle size={16} /> How to get this?
          </h3>
          <ol className="space-y-2 text-xs text-blue-800 list-decimal pl-4">
             <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold">console.firebase.google.com</a> and create a project.</li>
             <li>Go to <strong>Build &gt; Firestore Database</strong> and click <strong>Create Database</strong> (Start in <strong>Test Mode</strong>).</li>
             <li>Go to <strong>Project Settings</strong> (Gear icon).</li>
             <li>Scroll down to "Your apps", click <strong>&lt;/&gt; (Web)</strong>, register app.</li>
             <li>Copy the code inside <code>const firebaseConfig = &#123; ... &#125;;</code> and paste it above.</li>
          </ol>
        </div>
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
