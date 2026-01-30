
import React from 'react';

const Ingest: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-sm text-center">
        <div className="text-6xl mb-6">📥</div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Data Ingestion</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          This module allows for manual text ingestion of meeting transcripts or customer notes. 
          For now, please use the <strong>Integrations</strong> tab to sync data directly from Google Sheets.
        </p>
        <div className="inline-flex gap-4">
          <button 
            onClick={() => window.location.hash = 'integrations'}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    </div>
  );
};

export default Ingest;
