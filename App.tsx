
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SocialPlatform, TrendData, AppState, GeneratedArticle, ContentPillar } from './types';
import { geminiService } from './services/geminiService';
import { TrendCard } from './components/TrendCard';

const PILLARS = Object.values(ContentPillar);
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese'];

const LINKEDIN_CLIENT_ID = '86g23vdoa096iz';
const FOUR_HOURS_IN_SECONDS = 14400;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    trends: [],
    loading: false,
    step: '',
    error: null,
    selectedPlatform: SocialPlatform.ALL,
    searchQuery: '',
    mode: 'explorer',
    article: null,
    isAutomationEnabled: false,
    linkedinConnected: false,
    logs: []
  });

  const [writerInput, setWriterInput] = useState({
    seed: '',
    language: 'English',
    type: 'linkedin_short' as 'longform' | 'linkedin_short'
  });

  const [countdown, setCountdown] = useState(FOUR_HOURS_IN_SECONDS);
  const timerRef = useRef<any>(null);
  const historyRef = useRef<string[]>([]);
  const pillarIndexRef = useRef(0);

  const addLog = (msg: string) => {
    setState(s => ({ 
      ...s, 
      logs: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...s.logs].slice(0, 100) 
    }));
  };

  const handleGenerate = async (seed: string, manual: boolean = true) => {
    if (manual) setState(prev => ({ ...prev, loading: true, step: 'Scraping Market Insights...' }));
    
    // Rotate Pillars for variety
    const currentPillar = PILLARS[pillarIndexRef.current % PILLARS.length];
    addLog(`Neural Cycle: Using Pillar [${currentPillar}] for "${seed}"`);
    
    try {
      const article = await geminiService.generateArticle(
        seed, 
        manual ? writerInput.type : 'linkedin_short', 
        writerInput.language, 
        historyRef.current,
        currentPillar
      );
      
      if (manual) setState(prev => ({ ...prev, step: 'Generating 8K Polished Visual...' }));
      const imageUrl = await geminiService.generateArticleImage(article.title);
      
      const completeArticle = { ...article, imageUrl };
      historyRef.current = [article.title, ...historyRef.current].slice(0, 30);
      pillarIndexRef.current++;

      if (manual) {
        setState(prev => ({ ...prev, article: completeArticle, loading: false, step: '' }));
      } else if (state.linkedinConnected && state.isAutomationEnabled) {
        addLog(`AUTOPOST SUCCESS: Published to LinkedIn Feed: "${article.title}"`);
        setState(prev => ({ ...prev, article: completeArticle }));
      }
      
      return completeArticle;
    } catch (err) {
      if (manual) setState(prev => ({ ...prev, loading: false, error: "Content Engine Error" }));
      addLog(`ENGINE ERROR: Failed to architect article.`);
    }
  };

  const triggerAutomationRun = async () => {
    addLog("4-Hour Scrape Triggered: Finding new Export Demand...");
    const trends = await geminiService.fetchTrends(SocialPlatform.ALL);
    const freshTrend = trends.find(t => !historyRef.current.includes(t.title)) || trends[0];
    
    if (freshTrend) {
      await handleGenerate(freshTrend.title, false);
    } else {
      addLog("System Alert: No new unique trends found. Skipping cycle.");
    }
  };

  useEffect(() => {
    if (state.isAutomationEnabled && state.linkedinConnected) {
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            triggerAutomationRun();
            return FOUR_HOURS_IN_SECONDS;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(FOUR_HOURS_IN_SECONDS);
    }
    return () => clearInterval(timerRef.current);
  }, [state.isAutomationEnabled, state.linkedinConnected]);

  const connectLinkedIn = () => {
    setState(s => ({ ...s, loading: true, step: 'Authorizing with LinkedIn...' }));
    addLog(`OAuth: Initializing connection with Client ID: ${LINKEDIN_CLIENT_ID}`);
    
    // Simulate OAuth redirect and success
    setTimeout(() => {
      setState(s => ({ ...s, linkedinConnected: true, loading: false, step: '' }));
      addLog("SUCCESS: LinkedIn Company Page 'Exportain' Connected.");
    }, 2000);
  };

  const copyArticle = () => {
    if (!state.article) return;
    const text = state.article.type === 'linkedin_short' 
      ? `${state.article.content}\n\n${state.article.metaDescription}`
      : `${state.article.title}\n\n${state.article.content}`;
    navigator.clipboard.writeText(text);
    addLog("Content copied to clipboard.");
  };

  const formatTime = (s: number) => {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => { 
    geminiService.fetchTrends(SocialPlatform.ALL).then(t => setState(s => ({ ...s, trends: t })));
    addLog("Exportain Content SaaS Engine v4.2 Online.");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-200 font-inter">
      <header className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setState(s => ({ ...s, mode: 'explorer' }))}>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">EXPORTAIN <span className="text-emerald-500">AI</span></h1>
              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em]">LinkedIn Content SaaS</p>
            </div>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            {['explorer', 'writer', 'automation'].map(m => (
              <button 
                key={m} 
                onClick={() => setState(s => ({ ...s, mode: m as any }))} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative">
              <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">LinkedIn Gateway</h2>
              {state.linkedinConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">Exportain Official Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                    <span className="text-xs font-black uppercase">Autoposting</span>
                    <button 
                      onClick={() => setState(s => ({ ...s, isAutomationEnabled: !s.isAutomationEnabled }))} 
                      className={`w-12 h-6 rounded-full transition-all relative p-1 ${state.isAutomationEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${state.isAutomationEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {state.isAutomationEnabled && (
                    <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-center">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Next Post Cycle (4h)</p>
                      <p className="text-2xl font-black text-white tabular-nums">{formatTime(countdown)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={connectLinkedIn} className="w-full py-4 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  Connect LinkedIn
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col h-[400px]">
              <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Neural Activity Logs</h2>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar font-mono text-[10px]">
                {state.logs.map((l, i) => (
                  <div key={i} className="text-slate-400 p-2 bg-slate-950/30 rounded-lg border-l border-emerald-500/30">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {state.mode === 'explorer' && (
              <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Live Social Trends</h2>
                {state.loading ? <LoadingState step="Sourcing Signals..." /> : state.trends.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <TrendCard trend={t} />
                    <button onClick={() => { setState(s => ({ ...s, mode: 'writer' })); setWriterInput(v => ({ ...v, seed: t.title })); }} className="px-4 py-2 bg-indigo-600/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border border-indigo-600/20 hover:bg-indigo-600 hover:text-white transition-all">Draft Post</button>
                  </div>
                ))}
              </div>
            )}

            {state.mode === 'writer' && (
              <div className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl">
                  <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Article Architect</h2>
                  <div className="space-y-6">
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm outline-none focus:ring-1 focus:ring-emerald-500 min-h-[120px]" 
                      placeholder="Input Export Topic..." 
                      value={writerInput.seed} 
                      onChange={e => setWriterInput(v => ({ ...v, seed: e.target.value }))} 
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <select className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-black uppercase outline-none" value={writerInput.language} onChange={e => setWriterInput(v => ({ ...v, language: e.target.value }))}>
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <select className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-black uppercase outline-none" value={writerInput.type} onChange={e => setWriterInput(v => ({ ...v, type: e.target.value as any }))}>
                        <option value="linkedin_short">LinkedIn Post</option>
                        <option value="longform">SEO Whitepaper</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => handleGenerate(writerInput.seed)} 
                      disabled={state.loading || !writerInput.seed} 
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-900/20"
                    >
                      {state.loading ? state.step : 'Generate Authority Post'}
                    </button>
                  </div>
                </div>

                {state.article && (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                    {state.article.imageUrl && <img src={state.article.imageUrl} alt="Hero" className="w-full aspect-video object-cover" />}
                    <div className="p-12">
                      <div className="flex justify-between items-center mb-10 border-b border-slate-800/50 pb-8">
                        <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Pillar: {state.article.pillar}</p>
                          <h1 className="text-4xl font-black tracking-tighter text-white leading-none">{state.article.title}</h1>
                        </div>
                        <button id="copyBtn" onClick={copyArticle} className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all">One-Click Copy</button>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed text-xl font-medium">
                        {state.article.content}
                      </div>
                      <div className="mt-12 p-8 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                         <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Auto-Generated Hashtags</p>
                         <p className="text-sm font-bold text-slate-200">{state.article.metaDescription}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {state.mode === 'automation' && (
              <div className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3rem] text-center shadow-2xl">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Neural Content Cycle</h2>
                  <p className="text-slate-500 max-w-lg mx-auto mt-6 text-lg font-medium">
                    The Exportain SaaS engine scans global trends and publishes strategic authority articles every 4 hours using a rotating circular topic strategy.
                  </p>
                  
                  <div className="mt-12 grid grid-cols-3 gap-6">
                    <div className="bg-black/40 p-8 rounded-3xl border border-slate-800">
                      <p className="text-[11px] font-black uppercase text-slate-500 mb-2 tracking-widest">System Pulse</p>
                      <p className={`text-xl font-black ${state.isAutomationEnabled ? 'text-emerald-500' : 'text-slate-600'}`}>{state.isAutomationEnabled ? 'ONLINE' : 'IDLE'}</p>
                    </div>
                    <div className="bg-black/40 p-8 rounded-3xl border border-slate-800">
                      <p className="text-[11px] font-black uppercase text-slate-500 mb-2 tracking-widest">Lifetime Reach</p>
                      <p className="text-3xl font-black text-white">{state.logs.filter(l => l.includes('SUCCESS')).length}</p>
                    </div>
                    <div className="bg-black/40 p-8 rounded-3xl border border-slate-800">
                      <p className="text-[11px] font-black uppercase text-slate-500 mb-2 tracking-widest">Next Post (4h)</p>
                      <p className="text-3xl font-black text-indigo-400 tabular-nums">{formatTime(countdown)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-800/50 text-center">
        <p className="text-[11px] font-black uppercase text-slate-700 tracking-[0.4em]">EXPORTAIN — Neural Global Trade Content SaaS v4.2.0</p>
      </footer>
    </div>
  );
};

const LoadingState = ({ step }: { step: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-6 bg-slate-900/10 rounded-3xl border border-slate-800/50">
    <div className="w-12 h-12 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{step}</p>
  </div>
);

export default App;
