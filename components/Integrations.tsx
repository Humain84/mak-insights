
import React, { useState } from 'react';
import { SheetConfig } from '../types';

interface IntegrationsProps {
  config: SheetConfig;
  onUpdateConfig: (config: SheetConfig) => void;
}

const Integrations: React.FC<IntegrationsProps> = ({ config, onUpdateConfig }) => {
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [isTesting, setIsTesting] = useState(false);

  const handleConnect = () => {
    setIsTesting(true);
    // Simulate a connection check
    setTimeout(() => {
      onUpdateConfig({
        spreadsheetId,
        sheetName,
        isConnected: !!spreadsheetId,
        lastSync: config.lastSync
      });
      setIsTesting(false);
      if (spreadsheetId) {
        alert('Google Sheets connection established successfully!');
      }
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">
            📊
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Google Workspace</h2>
            <p className="text-slate-500">Connect your enterprise sheets to automate intelligence.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Google Sheets Connector
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Spreadsheet ID</label>
                <input 
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="e.g. 1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Found in your browser address bar: docs.google.com/spreadsheets/d/<strong>[ID_HERE]</strong>/edit
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Sheet/Tab Name</label>
                <input 
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="e.g. Q4_Transcripts"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleConnect}
                disabled={isTesting}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isTesting ? 'bg-slate-100 text-slate-400' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isTesting ? 'Verifying...' : config.isConnected ? 'Update Connection' : 'Connect Workspace Sheet'}
              </button>
            </div>
          </div>

          <div className="p-6 border border-blue-100 bg-blue-50 rounded-2xl">
            <h4 className="text-sm font-bold text-blue-800 mb-2">How it works</h4>
            <ul className="text-xs text-blue-600 space-y-2 list-disc pl-4">
              <li>Ensure the sheet is shared with "Anyone with the link can view" or within your Workspace domain.</li>
              <li>Columns like <strong>Transcript</strong>, <strong>Date</strong>, and <strong>Type</strong> will be auto-detected.</li>
              <li>New rows added to your sheet can be synced to IntelCX with a single click.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
