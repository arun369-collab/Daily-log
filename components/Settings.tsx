
import React, { useState, useEffect } from 'react';
import { Save, Link, CheckCircle, HelpCircle, LogOut, Copy } from 'lucide-react';
import { getSyncUrl, saveSyncUrl, syncDown } from '../services/syncService';

interface SettingsProps {
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(getSyncUrl());
  }, []);

  const handleSave = () => {
    saveSyncUrl(url);
    setSaved(true);
    // Try to sync immediately on save
    syncDown().then(() => {
        // Optional: refresh page or notify
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const scriptCode = `
function doGet(e) {
  var fileName = "FactoryFlow_DB.json";
  var files = DriveApp.getFilesByName(fileName);
  
  if (files.hasNext()) {
    var file = files.next();
    var content = file.getBlob().getDataAsString();
    return ContentService.createTextOutput(content)
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    // Return empty structure if file doesn't exist yet
    var initialData = JSON.stringify({records:[], orders:[], customers:[]});
    return ContentService.createTextOutput(initialData)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 
  try {
    var data = e.postData.contents;
    var fileName = "FactoryFlow_DB.json";
    var files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      files.next().setContent(data);
    } else {
      DriveApp.createFile(fileName, data, MimeType.PLAIN_TEXT);
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({error: e.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`.trim();

  const copyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <Link size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cloud Database Sync</h2>
            <p className="text-gray-500 text-sm">Synchronize data across all devices using Google Drive.</p>
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
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm font-mono text-gray-600"
            />
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {saved ? <><CheckCircle size={18} /> Settings Saved & Synced</> : <><Save size={18} /> Save & Connect</>}
          </button>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-5 border border-blue-100">
          <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
            <HelpCircle size={16} /> Setup Instructions (Required for Multi-Device)
          </h3>
          <div className="space-y-3">
             <div className="text-xs text-blue-700 font-medium">
               This script creates a database file in your Google Drive. You do NOT need to create a Google Sheet manually.
             </div>
             <div className="text-xs text-blue-700">
               1. Go to <a href="https://script.google.com/home" target="_blank" className="underline font-bold">script.google.com</a> and create a new project.
             </div>
             <div className="text-xs text-blue-700">
               2. Delete any code in <code>Code.gs</code> and paste the code below:
             </div>
             
             <div className="relative">
                <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-[10px] overflow-x-auto font-mono leading-relaxed">
                  {scriptCode}
                </pre>
                <button 
                  onClick={copyCode} 
                  className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                  title="Copy Code"
                >
                   {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                </button>
             </div>

             <div className="text-xs text-blue-700">
               3. Click <strong>Deploy &gt; New Deployment</strong>.
             </div>
             <div className="text-xs text-blue-700">
               4. Select type: <strong>Web app</strong>.
             </div>
             <div className="text-xs text-blue-700 font-bold">
               5. Important: Set "Who has access" to "Anyone".
             </div>
             <div className="text-xs text-blue-700">
               6. Click Deploy, authorize access, copy the URL, and paste it above.
             </div>
          </div>
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
