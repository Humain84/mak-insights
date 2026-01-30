import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ReportList from './components/ReportList';
import Integrations from './components/Integrations';
import Ingest from './components/Ingest';
import { AnalysisResult, SheetConfig, ReportType } from './types';
import { analyzeTranscript } from './services/geminiService';
import { fetchSheetData, SheetRow } from './services/googleSheetsService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState<AnalysisResult[]>([]);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({
    spreadsheetId: '',
    sheetName: 'Sheet1',
    isConnected: false
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [rawSheetRows, setRawSheetRows] = useState<any[]>([]);

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
      const { rows, columnNames: cols } = sheetData;
      
      // Store column names and raw rows for column summary feature
      setColumnNames(cols);
      setRawSheetRows(rows);
      
      // Analyze each row that has transcript data
      const newReports: AnalysisResult[] = [];
      for (const row of rows) {
        const transcript = row['Transcript'] || row['transcript'] || row['Text'] || row['text'] || '';
        const typeStr = row['Type'] || row['type'] || 'Sales Call';
        const fileName = row['File'] || row['file'] || row['Date'] || row['date'] || 'Unknown';
        
        if (transcript.trim()) {
          const reportType = Object.values(ReportType).includes(typeStr as ReportType) 
            ? (typeStr as ReportType) 
            : ReportType.SALES_CALL;
          
          try {
            const analysis = await analyzeTranscript(transcript, fileName, reportType);
            newReports.push(analysis);
          } catch (error) {
            console.error(`Error analyzing row: ${error}`);
          }
        }
      }

      setReports(newReports);
      setSheetConfig({ ...sheetConfig, lastSync: new Date().toISOString() });
      alert(`Successfully synced ${newReports.length} reports!`);
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

  const handleUpdatePrompt = (prompt: string) => {
    setSheetConfig({ ...sheetConfig, analysisPrompt: prompt });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            data={reports}
            sheetConfig={sheetConfig}
            onUpdatePrompt={handleUpdatePrompt}
            onSync={handleSync}
            isSyncing={isSyncing}
            columnNames={columnNames}
            rawSheetRows={rawSheetRows}
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
            data={reports}
            sheetConfig={sheetConfig}
            onUpdatePrompt={handleUpdatePrompt}
            onSync={handleSync}
            isSyncing={isSyncing}
            columnNames={columnNames}
            rawSheetRows={rawSheetRows}
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
