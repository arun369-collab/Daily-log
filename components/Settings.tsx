import React, { useState, useEffect } from 'react';
import { Save, Link, CheckCircle, HelpCircle, LogOut } from 'lucide-react';
import { getSyncUrl, saveSyncUrl } from '../services/syncService';

interface SettingsProps {
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUrl(getSyncUrl());
  }, []);

  const handleSave = () => {
    saveSyncUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <Link size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Google Sheets Sync</h2>
            <p className="text-gray-500 text-sm">Connect your ledger directly to a Google Sheet.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Apps Script Web App URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm font-mono text-gray-600"
            />
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {saved ? <><CheckCircle size={18} /> Settings Saved</> : <><Save size={18} /> Save Configuration</>}
          </button>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
            <HelpCircle size={16} /> How to set this up?
          </h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 ml-1">
            <li>Create a new Google Sheet.</li>
            <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
            <li>Paste the "Bridge Script" (ask the chatbot for the code).</li>
            <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
            <li>Select type <strong>Web app</strong>.</li>
            <li>Set <em>Who has access</em> to <strong>Anyone</strong>.</li>
            <li>Copy the URL and paste it above.</li>
          </ol>
        </div>
      </div>

      {/* Account Section - Visible mainly for Mobile convenience */}
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