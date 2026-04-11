import React, { useState, useMemo, useCallback, useEffect, useReducer, useContext } from 'react';
import Card from './Card';
import { DataContext } from '../context/DataContext';
import { 
  Puzzle, Globe, Zap, Activity, ShieldCheck, Cpu, ArrowRight, 
  CheckCircle2, Trash2, Command, Sparkles, Terminal, Search, 
  RefreshCw, Code2, Rocket
} from 'lucide-react';

// --- Types ---
type MarketplaceSection = 'EXPLORE' | 'INSTALLED' | 'FORGE' | 'DETAIL';

interface Integration {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'beta' | 'new';
  rating: number;
  installs: number;
  uptime: number;
  latency: number;
  tags: string[];
}

// --- Mock Data ---
const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'int_1', name: 'Salesforce Connect', provider: 'Salesforce', category: 'CRM', description: 'Bi-directional sync of executive relationship data.', icon: <Globe className="text-blue-400" />, status: 'active', rating: 4.9, installs: 12400, uptime: 99.99, latency: 45, tags: ['Enterprise', 'Secure'] },
  { id: 'int_2', name: 'Slack Neural Relay', provider: 'Slack', category: 'Communication', description: 'Direct AI insights pushed to mission-critical channels.', icon: <Zap className="text-purple-400" />, status: 'active', rating: 4.8, installs: 8900, uptime: 99.95, latency: 12, tags: ['Real-time', 'Alerts'] },
  { id: 'int_3', name: 'Dune Analytics Link', provider: 'Dune', category: 'Web3', description: 'Import on-chain whale activity directly into Global Ledger.', icon: <Activity className="text-cyan-400" />, status: 'beta', rating: 4.7, installs: 3200, uptime: 98.4, latency: 120, tags: ['DeFi', 'Analytics'] },
  { id: 'int_4', name: 'Stripe Global Gateway', provider: 'Stripe', category: 'Payments', description: 'Hyper-scale settlement across 135+ currencies.', icon: <ShieldCheck className="text-indigo-400" />, status: 'active', rating: 5.0, installs: 45000, uptime: 100, latency: 8, tags: ['Finance', 'Stable'] },
  { id: 'int_citi', name: 'Citi Connect', provider: 'Citi', category: 'Banking', description: 'Real-time access to Citi account data.', icon: <Globe className="text-blue-600" />, status: 'active', rating: 4.8, installs: 5000, uptime: 99.9, latency: 50, tags: ['Banking', 'Secure'] },
  { id: 'int_5', name: 'Datadog Sentinel', provider: 'Datadog', category: 'DevOps', description: 'Monitor infrastructure integrity via neural telemetry.', icon: <Cpu className="text-orange-400" />, status: 'active', rating: 4.9, installs: 15600, uptime: 99.99, latency: 32, tags: ['Monitoring', 'Cloud'] },
  { id: 'int_marqeta', name: 'Marqeta Card Issuing', provider: 'Marqeta', category: 'Payments', description: 'Programmatic card issuing and management.', icon: <Zap className="text-yellow-400" />, status: 'active', rating: 4.9, installs: 2100, uptime: 99.99, latency: 15, tags: ['Payments', 'Cards'] },
  { id: 'int_modtreasury', name: 'Modern Treasury', provider: 'Modern Treasury', category: 'Payments', description: 'Automated payment operations and reconciliation.', icon: <ShieldCheck className="text-green-400" />, status: 'active', rating: 4.9, installs: 3500, uptime: 99.99, latency: 10, tags: ['Payments', 'Treasury'] },
];

// --- Reducer Logic ---
interface State {
  section: MarketplaceSection;
  selectedAppId: string | null;
  searchQuery: string;
  categoryFilter: string;
  installedApps: string[];
  isIdeating: boolean;
  aiIdea: string | null;
}

type Action = 
  | { type: 'SET_SECTION'; payload: MarketplaceSection }
  | { type: 'SELECT_APP'; payload: string | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'INSTALL_APP'; payload: string }
  | { type: 'UNINSTALL_APP'; payload: string }
  | { type: 'START_AI_IDEATION' }
  | { type: 'FINISH_AI_IDEATION'; payload: string }
  | { type: 'CLEAR_AI_IDEA' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SECTION': return { ...state, section: action.payload, selectedAppId: null };
    case 'SELECT_APP': return { ...state, selectedAppId: action.payload, section: action.payload ? 'DETAIL' : 'EXPLORE' };
    case 'SET_SEARCH': return { ...state, searchQuery: action.payload };
    case 'SET_CATEGORY': return { ...state, categoryFilter: action.payload };
    case 'INSTALL_APP': return { ...state, installedApps: [...state.installedApps, action.payload] };
    case 'UNINSTALL_APP': return { ...state, installedApps: state.installedApps.filter(id => id !== action.payload) };
    case 'START_AI_IDEATION': return { ...state, isIdeating: true, aiIdea: null };
    case 'FINISH_AI_IDEATION': return { ...state, isIdeating: false, aiIdea: action.payload };
    case 'CLEAR_AI_IDEA': return { ...state, aiIdea: null };
    default: return state;
  }
};

const initialState: State = {
  section: 'EXPLORE',
  selectedAppId: null,
  searchQuery: '',
  categoryFilter: 'All',
  installedApps: ['int_1', 'int_4'],
  isIdeating: false,
  aiIdea: null
};

// --- Sub-Components ---
const NavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
      active 
        ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
        : 'text-gray-500 hover:text-white hover:bg-gray-800'
    }`}
  >
    {icon}
    {label}
  </button>
);

const IntegrationCard: React.FC<{ app: Integration; onClick: () => void; isInstalled: boolean }> = ({ app, onClick, isInstalled }) => (
  <div 
    onClick={onClick}
    className="group bg-gray-900/40 backdrop-blur-xl border border-gray-800 hover:border-cyan-500/50 p-6 rounded-[2rem] transition-all duration-500 cursor-pointer relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
       <ArrowRight className="w-5 h-5 text-cyan-500" />
    </div>
    
    <div className="flex items-start gap-5 mb-6">
      <div className="w-14 h-14 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        {app.icon}
      </div>
      <div>
        <h4 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors leading-tight">{app.name}</h4>
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">{app.provider}</p>
      </div>
    </div>

    <p className="text-sm text-gray-400 mb-6 line-clamp-2 leading-relaxed font-light">
      {app.description}
    </p>

    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
       <div className="flex gap-1">
          {app.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] font-black uppercase px-2 py-1 bg-gray-950 rounded-full text-gray-400 border border-gray-800">
               {tag}
            </span>
          ))}
       </div>
       {isInstalled && (
         <div className="flex items-center gap-1 text-[10px] font-black text-cyan-400 uppercase">
            <CheckCircle2 size={12} /> Syncing
         </div>
       )}
    </div>
  </div>
);

// --- Main View ---
const IntegrationsMarketplaceView: React.FC = () => {
  const context = useContext(DataContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleForgeAI = async () => {
    if (!aiPrompt.trim()) return;
    dispatch({ type: 'START_AI_IDEATION' });
    try {
      const response = await fetch('/api/v1/ai/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiPrompt })
      });

      if (!response.ok) throw new Error('Failed to forge integration');
      
      const data = await response.json();
      dispatch({ type: 'FINISH_AI_IDEATION', payload: data.text });
    } catch (err) {
      console.error(err);
      dispatch({ type: 'FINISH_AI_IDEATION', payload: 'Neural link interrupted. Re-establishing secure tunnel...' });
    }
  };

  const handleCitiSync = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch('/api/v1/citi/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      });
      const data = await response.json();
      
      if (data.accountGroupSummaryList && context?.setInternalAccounts) {
        const citiAccounts = data.accountGroupSummaryList.flatMap((group: any) => 
          group.accounts.map((acc: any) => ({
            id: acc.accountId,
            name: acc.accountNickname || acc.productName,
            balance: acc.accountBalance,
            institution: 'Citibank',
          }))
        );
        context.setInternalAccounts(citiAccounts);
        context.showNotification?.('Citi accounts synchronized', 'info');
      }
    } catch (error) {
      context?.showNotification?.('Failed to sync Citi accounts', 'error');
    }
  }, [context]);

  // OAuth Listener
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const code = event.data.code;
        try {
          const response = await fetch('/api/v1/citi/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          const data = await response.json();
          if (data.access_token) {
            dispatch({ type: 'INSTALL_APP', payload: 'int_citi' });
            handleCitiSync(data.access_token);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleCitiSync]);

  const filteredApps = useMemo(() => {
    return MOCK_INTEGRATIONS.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesCategory = state.categoryFilter === 'All' || app.category === state.categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [state.searchQuery, state.categoryFilter]);

  const categories = useMemo(() => ['All', ...new Set(MOCK_INTEGRATIONS.map(a => a.category))], []);
  const selectedApp = useMemo(() => MOCK_INTEGRATIONS.find(a => a.id === state.selectedAppId), [state.selectedAppId]);

  return (
    <div className="min-h-screen space-y-10 p-8 animate-in fade-in duration-700 bg-black text-white">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-gray-800 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Puzzle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xs font-mono text-cyan-400 uppercase tracking-[0.4em]">Nexus Integration Fabric v4.0</h2>
          </div>
          <h1 className="text-7xl font-black tracking-tighter leading-none">
            Command Center
          </h1>
        </div>
        <div className="flex gap-3 p-1.5 bg-gray-950 border border-gray-800 rounded-3xl">
          {(['EXPLORE', 'INSTALLED', 'FORGE'] as MarketplaceSection[]).map(sec => (
            <NavItem 
              key={sec}
              active={state.section === sec} 
              icon={sec === 'EXPLORE' ? <Globe size={16} /> : sec === 'INSTALLED' ? <CheckCircle2 size={16} /> : <Terminal size={16} />} 
              label={sec} 
              onClick={() => dispatch({ type: 'SET_SECTION', payload: sec })} 
            />
          ))}
        </div>
      </header>

      {/* Explore Grid */}
      {state.section === 'EXPLORE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredApps.map(app => (
             <IntegrationCard 
               key={app.id} 
               app={app} 
               isInstalled={state.installedApps.includes(app.id)}
               onClick={() => dispatch({ type: 'SELECT_APP', payload: app.id })} 
             />
           ))}
        </div>
      )}

      {/* Forge AI View */}
      {state.section === 'FORGE' && (
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-12 lg:col-span-5">
            <Card title="Forge Directive" icon={<Sparkles className="text-cyan-400" />}>
              <textarea 
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe your data mesh..."
                className="w-full h-48 bg-gray-950 border border-gray-800 rounded-2xl p-4 mt-4 text-white focus:border-cyan-500 outline-none resize-none"
              />
              <button 
                onClick={handleForgeAI}
                disabled={state.isIdeating}
                className="w-full py-4 mt-4 bg-cyan-600 rounded-2xl font-black tracking-widest hover:bg-cyan-500 transition-all disabled:opacity-50"
              >
                {state.isIdeating ? <RefreshCw className="animate-spin mx-auto" /> : 'INITIALIZE SYNTHESIS'}
              </button>
            </Card>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-gray-950 border border-gray-800 rounded-[2rem] p-8 h-full min-h-[500px] font-mono text-sm">
              {state.isIdeating ? (
                <div className="flex flex-col items-center justify-center h-full text-cyan-400 animate-pulse">
                  <RefreshCw className="animate-spin mb-4" size={32} />
                  SYNCING NEURAL PATHWAYS...
                </div>
              ) : state.aiIdea ? (
                <div className="whitespace-pre-wrap text-gray-300">{state.aiIdea}</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <Code2 size={48} className="mb-4" />
                  AWAITING DIRECTIVE
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsMarketplaceView;