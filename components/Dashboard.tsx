
import React, { useMemo, useState, useEffect } from 'react';
import { AnalysisResult, SheetConfig, MetaAnalysis } from '../types';
import { generateMetaAnalysis } from '../services/geminiService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DashboardProps {
  data: AnalysisResult[];
  sheetConfig: SheetConfig;
  onUpdatePrompt: (prompt: string) => void;
  onSync: () => void;
  isSyncing: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, sheetConfig, onUpdatePrompt, onSync, isSyncing }) => {
  const [analysis, setAnalysis] = useState<MetaAnalysis | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(sheetConfig.analysisPrompt || '');

  useEffect(() => {
    const runGlobalAnalysis = async () => {
      if (data.length > 0) {
        setIsSynthesizing(true);
        try {
          const result = await generateMetaAnalysis(data, sheetConfig.analysisPrompt);
          setAnalysis(result);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSynthesizing(false);
        }
      }
    };
    runGlobalAnalysis();
  }, [data, sheetConfig.analysisPrompt]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const avgSent = data.reduce((acc, c) => acc + c.metrics.customerSentiment, 0) / data.length;
    const totalValue = data.reduce((acc, c) => acc + (c.metrics.dealSizeEstimate || 0), 0);
    const avgRisk = data.reduce((acc, c) => acc + c.metrics.churnRisk, 0) / data.length;
    
    const pieData = Object.entries(data.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as any)).map(([name, value]) => ({ name, value }));

    return { avgSent: avgSent.toFixed(1), totalValue, avgRisk: avgRisk.toFixed(1), pieData };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-8xl mb-6">🛰️</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Awaiting Data Feed</h2>
        <p className="text-slate-500 mb-8">
          {sheetConfig.isConnected 
            ? "Click Sync to load data from your connected spreadsheet." 
            : "Connect your workspace spreadsheet to begin analysis."}
        </p>
        <div className="flex gap-4">
          {sheetConfig.isConnected ? (
            <button 
              onClick={onSync} 
              disabled={isSyncing}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSyncing ? 'Syncing...' : '🔄 Sync Data'}
            </button>
          ) : (
            <button 
              onClick={() => window.location.hash = 'integrations'} 
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl"
            >
              Integrations
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="p-2 bg-blue-500/20 rounded-xl text-blue-400">✨</span>
                Executive Intelligence
              </h2>
              {isSynthesizing && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full animate-pulse font-black uppercase tracking-widest">Synthesizing...</span>}
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); onUpdatePrompt(localPrompt); }} className="relative">
              <input 
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="What should I look for in the data?"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-blue-600 px-6 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">Analyze</button>
            </form>

            <div className="text-slate-400 leading-relaxed text-sm h-32 overflow-y-auto scrollbar-hide">
              {analysis?.executiveNarrative || "Generating narrative..."}
            </div>
          </div>

          <div className="border-l border-slate-800 pl-8 space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategic Signals</h3>
            <div className="space-y-3">
              {analysis?.topFeatures.map((f, i) => (
                <div key={i} className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                  <h4 className="text-xs font-bold text-white mb-1">{f.title}</h4>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => <div key={j} className={`h-1 flex-1 rounded-full ${j < (f.impactScore/20) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Sentiment Score" value={`${stats?.avgSent}%`} sub="Across All Segments" />
        <KpiCard label="Pipeline Value" value={`$${stats?.totalValue.toLocaleString()}`} sub="Aggregated Potential" />
        <KpiCard label="Churn Risk" value={`${stats?.avgRisk}%`} sub="Systemic Warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 h-80">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Segment Distribution</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={stats?.pieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} cornerRadius={8} paddingAngle={5}>
                {stats?.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 h-80">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sentiment Trend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={data.map(d => ({ v: d.metrics.customerSentiment }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <Tooltip />
              <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f610" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, sub }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-slate-900 mb-1">{value}</p>
    <p className="text-[10px] text-slate-400 font-bold">{sub}</p>
  </div>
);

export default Dashboard;
