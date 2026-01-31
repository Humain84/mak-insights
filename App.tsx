import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ReportList from './components/ReportList';
import Integrations from './components/Integrations';
import Ingest from './components/Ingest';
import { AnalysisResult, SheetConfig } from './types';
import { generateCustomerInsightSummaries } from './services/geminiService';
import { fetchSheetData } from './services/googleSheetsService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState<AnalysisResult[]>([]);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({
    spreadsheetId: '',
    sheetName: 'Sheet1',
    isConnected: false
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [customerSummaries, setCustomerSummaries] = useState<{
    overall: string;
    strengths: string;
    weaknesses: string;
    opportunities: string;
    threats: string;
    features_requested: string;
  } | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('sheetConfig');
    if (savedConfig) {
      setSheetConfig(JSON.parse(savedConfig));
    }
    
    const savedReports = localStorage.getItem('reports');
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    }

    // Handle hash-based routing
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'reports', 'integrations', 'ingest'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sheetConfig', JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  // Save reports to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reports', JSON.stringify(reports));
  }, [reports]);

  const handleSync = async () => {
    if (!sheetConfig.spreadsheetId || !sheetConfig.isConnected) {
      alert('Please connect a Google Sheet first in the Integrations tab.');
      return;
    }

    setIsSyncing(true);
    try {
      const sheetData = await fetchSheetData(sheetConfig.spreadsheetId, sheetConfig.sheetName);

      // Generate summaries from all rows
      const summaries = await generateCustomerInsightSummaries(sheetData.rows);

      setCustomerSummaries(summaries);
      setSheetConfig({ ...sheetConfig, lastSync: new Date().toISOString() });
      alert(`Successfully synced and summarized ${sheetData.rows.length} customer records!`);
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Error syncing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateConfig = (config: SheetConfig) => {
    setSheetConfig(config);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onSync={handleSync}
            isSyncing={isSyncing}
            customerSummaries={customerSummaries}
          />
        );
      case 'reports':
        return <ReportList reports={reports} />;
      case 'integrations':
        return <Integrations config={sheetConfig} onUpdateConfig={handleUpdateConfig} />;
      case 'ingest':
        return <Ingest />;
      default:
        return (
          <Dashboard
            onSync={handleSync}
            isSyncing={isSyncing}
            customerSummaries={customerSummaries}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
