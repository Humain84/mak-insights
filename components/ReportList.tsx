
import React, { useState, useEffect } from 'react';
// @google/genai coding guideline: Ensuring correct import of types from types.ts
import { AnalysisResult, StrategicDossiers } from '../types';
import { generateStrategicDossiers } from '../services/geminiService';

interface ReportListProps {
  reports: AnalysisResult[];
}

type DossierType = 'yesNo' | 'swot' | 'actNow';

const ReportList: React.FC<ReportListProps> = ({ reports }) => {
  const [dossiers, setDossiers] = useState<StrategicDossiers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDossier, setActiveDossier] = useState<DossierType>('yesNo');

  useEffect(() => {
    if (reports.length > 0 && !dossiers) {
      loadDossiers();
    }
  }, [reports]);

  const loadDossiers = async () => {
    setIsLoading(true);
    try {
      const data = await generateStrategicDossiers(reports);
      setDossiers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <div className="text-6xl mb-4">📑</div>
        <p className="text-lg font-medium">Connect a spreadsheet to generate strategic reports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Dossier Navigation */}
      <div className="flex flex-wrap gap-4 items-center justify-center bg-slate-200/40 p-2 rounded-[2rem] w-fit mx-auto border border-slate-200 shadow-inner">
        <DossierNavButton 
          active={activeDossier === 'yesNo'} 
          onClick={() => setActiveDossier('yesNo')}
          icon="⚖️"
          label="Why Customers say Yes or No"
        />
        <DossierNavButton 
          active={activeDossier === 'swot'} 
          onClick={() => setActiveDossier('swot')}
          icon="🔭"
          label="Opportunities and Threats"
        />
        <DossierNavButton 
          active={activeDossier === 'actNow'} 
          onClick={() => setActiveDossier('actNow')}
          icon="⚡"
          label="Act Now"
        />
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gemini 3 Pro generating strategic dossier...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeDossier === 'yesNo' && (
              <DossierCard 
                title="Why Customers say Yes or No" 
                subtitle="Psychological & Business Drivers for Conversion"
                content={dossiers?.yesNo || ''}
                icon="⚖️"
                color="blue"
              />
            )}
            {activeDossier === 'swot' && (
              <DossierCard 
                title="Opportunities and Threats" 
                subtitle="SWOT Analysis & Competitive Landscape"
                content={dossiers?.oppsThreats || ''}
                icon="🔭"
                color="emerald"
              />
            )}
            {activeDossier === 'actNow' && (
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl border border-slate-800">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-lg shadow-red-900/40">⚡</div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">Act Now</h3>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">High-Priority Directives</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dossiers?.actNow.map((action, idx) => (
                    <div key={idx} className="group flex gap-6 p-8 bg-slate-800/40 rounded-[2.5rem] border border-slate-800 hover:border-red-500/30 transition-all hover:bg-slate-800/60">
                      <span className="text-3xl font-black text-red-500/40 group-hover:text-red-500 transition-colors">0{idx + 1}</span>
                      <p className="text-lg text-slate-300 leading-relaxed font-medium group-hover:text-white transition-colors">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button 
          onClick={loadDossiers}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors py-4 px-8"
        >
          🔄 Force Regeneration of Strategic Views
        </button>
      </div>
    </div>
  );
};

const DossierNavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-8 py-3 rounded-[1.5rem] text-sm font-bold flex items-center gap-3 transition-all ${
      active 
      ? 'bg-white shadow-lg text-slate-900 scale-105' 
      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
    }`}
  >
    <span className="text-lg">{icon}</span>
    {label}
  </button>
);

const DossierCard: React.FC<{ title: string; subtitle: string; content: string; icon: string; color: 'blue' | 'emerald' }> = ({ title, subtitle, content, icon, color }) => {
  const colorClass = color === 'blue' ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200';
  
  return (
    <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-6 mb-10">
        <div className={`w-16 h-16 ${colorClass} rounded-[1.5rem] flex items-center justify-center text-3xl text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{subtitle}</p>
        </div>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <div className="text-slate-700 text-lg leading-relaxed space-y-6 columns-1 md:columns-2 gap-12">
          {content.split('\n\n').map((para, i) => (
            <p key={i} className="break-inside-avoid">{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportList;
