import React from 'react';

interface CustomerSummaries {
  overall: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  features_requested: string;
}

interface DashboardProps {
  onSync: () => void;
  isSyncing: boolean;
  customerSummaries: CustomerSummaries | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onSync, isSyncing, customerSummaries }) => {
  if (!customerSummaries) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-8xl mb-6">🛰️</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Awaiting Data Feed</h2>
        <p className="text-slate-500 mb-8">Connect your workspace spreadsheet to begin analysis.</p>
        <button onClick={() => window.location.hash = 'integrations'} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl">Integrations</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Button Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSyncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Sync Data</span>
            </>
          )}
        </button>
      </div>

      {/* Executive Summary */}
      {customerSummaries && (
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
            <span className="p-2 bg-blue-500/20 rounded-xl text-blue-400">✨</span>
            Executive Summary
          </h2>
          <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
            {customerSummaries.overall}
          </div>
        </div>
      )}

      {/* SWOT Grid */}
      {customerSummaries && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummaryCard title="Strengths" content={customerSummaries.strengths} color="green" />
          <SummaryCard title="Weaknesses" content={customerSummaries.weaknesses} color="red" />
          <SummaryCard title="Opportunities" content={customerSummaries.opportunities} color="blue" />
          <SummaryCard title="Threats" content={customerSummaries.threats} color="amber" />
        </div>
      )}

      {/* Features Requested */}
      {customerSummaries && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4">Features Requested</h3>
          <div className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
            {customerSummaries.features_requested}
          </div>
        </div>
      )}

      {!customerSummaries && (
        <div className="bg-slate-100 rounded-[2.5rem] p-10 text-center">
          <p className="text-slate-500">Click "Sync Data" to generate customer insight summaries from your Google Sheet.</p>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, content, color }: { title: string; content: string; color: string }) => {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
  };
  const titleColor: Record<string, string> = {
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
  };

  return (
    <div className={`p-6 rounded-[2rem] border shadow-sm ${colorClasses[color]}`}>
      <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${titleColor[color]}`}>{title}</h3>
      <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

export default Dashboard;
