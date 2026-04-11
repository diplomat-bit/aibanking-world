
import React, { useState, useContext, useEffect, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import { RefreshCw, Command as CommandIcon, Bell, User, Zap, Activity, ShieldCheck, Wallet, Sparkles, Search, FileText, DatabaseZap } from 'lucide-react';
import { View } from '../types';
import { SOVEREIGN_APPS } from '../constants';

const GeminiBar: React.FC = () => {
    const context = useContext(DataContext);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim() || !context) {
            setResults([]);
            return;
        }

        const searchResults: any[] = [];
        const q = query.toLowerCase();

        // Search Views
        Object.entries(View).forEach(([key, value]) => {
            if (key.toLowerCase().includes(q) || value.toLowerCase().includes(q)) {
                searchResults.push({ type: 'view', id: value, title: key, subtitle: 'System Module', icon: <CommandIcon size={14} /> });
            }
        });

        // Search Apps
        SOVEREIGN_APPS.forEach(app => {
            if (app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)) {
                searchResults.push({ type: 'app', id: app.id, title: app.name, subtitle: 'External App', icon: <Zap size={14} /> });
            }
        });

        // Search Transactions
        context.transactions.forEach(tx => {
            if (tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q)) {
                searchResults.push({ type: 'transaction', id: tx.id, title: tx.description, subtitle: `Transaction • $${tx.amount}`, icon: <FileText size={14} /> });
            }
        });

        // Search Accounts
        context.internalAccounts.forEach(acc => {
            if (acc.bestName.toLowerCase().includes(q) || acc.bankName.toLowerCase().includes(q)) {
                searchResults.push({ type: 'account', id: acc.id, title: acc.bestName, subtitle: `Account • ${acc.bankName}`, icon: <Wallet size={14} /> });
            }
        });

        setResults(searchResults.slice(0, 8)); // Limit to 8 results
        setIsOpen(true);
    }, [query, context]);

    const handleSelect = (result: any) => {
        if (!context) return;
        
        if (result.type === 'view') {
            context.setView(result.id);
        } else if (result.type === 'app') {
            const app = SOVEREIGN_APPS.find(a => a.id === result.id);
            if (app) context.setView(app.viewId || app.id);
        } else if (result.type === 'transaction') {
            context.setView(View.Transactions);
        } else if (result.type === 'account') {
            context.setView(View.Dashboard);
        }
        
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-xl group hidden md:block z-50">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-500 transition-colors">
                <Search size={16} />
            </div>
            <input
                type="text"
                className="w-full bg-gray-900/50 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-xs text-white placeholder-gray-600"
                placeholder="Search modules, apps, transactions, accounts..."
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => query.trim() && setIsOpen(true)}
            />
            
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                        {results.map((result, idx) => (
                            <button
                                key={`${result.type}-${result.id}-${idx}`}
                                onClick={() => handleSelect(result)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group/item"
                            >
                                <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover/item:text-cyan-400 group-hover/item:bg-cyan-500/10 transition-colors">
                                    {result.icon}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{result.title}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{result.subtitle}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const GeminiEngineStatus: React.FC = () => {
    const context = useContext(DataContext);
    const isSyncing = context?.isSyncing;

    const messages = [
        "Gemini: Mapping risk vectors...",
        "Gemini: All systems hyper-nominal.",
        "Gemini: Calibrating data mesh..."
    ];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="hidden xl:flex items-center space-x-4 text-[10px] text-cyan-300/80 bg-gray-950/80 px-4 py-2 rounded-full border border-cyan-500/20 backdrop-blur-md shadow-inner">
            <div className="flex space-x-1 items-end h-4">
                <span className={`w-1 h-2 bg-cyan-400 rounded-full ${isSyncing ? 'animate-bounce' : 'animate-pulse'}`}></span>
                <span className={`w-1 h-3 bg-cyan-400 rounded-full ${isSyncing ? 'animate-bounce [animation-delay:0.1s]' : 'animate-pulse [animation-delay:-0.2s]'}`}></span>
                <span className={`w-1 h-4 bg-cyan-400 rounded-full ${isSyncing ? 'animate-bounce [animation-delay:0.2s]' : 'animate-pulse'}`}></span>
            </div>
            <span className="font-mono uppercase tracking-widest">{isSyncing ? "Neural Synchronizing..." : messages[currentIndex]}</span>
            <span className="w-px h-3 bg-cyan-500/20"></span>
            <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                <span className="font-mono uppercase">Mesh: Active</span>
            </div>
        </div>
    );
};

const Header: React.FC<{ setActiveView: (view: any) => void; onMenuClick: () => void; }> = ({ setActiveView, onMenuClick }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { notifications, isSyncing, walletAddress, ethBalance, setWalletConnectModalOpen } = context;
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <header className="py-4 px-8 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center z-40 shrink-0">
      <div className="flex items-center space-x-6">
        <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <CommandIcon size={24} />
        </button>
        <div className="flex flex-col cursor-pointer" onClick={() => setActiveView(View.Dashboard)}>
           <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase leading-none">
             James Burvel oCallaghan III
           </h1>
           <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-widest leading-none">
             Sovereign Node_07 // {isSyncing ? "SYNC_IN_PROGRESS" : "CONNECTED"}
           </p>
        </div>
      </div>
      
      <div className="flex-1 flex justify-center">
         <GeminiBar />
      </div>

      <div className="flex items-center space-x-6">
        <GeminiEngineStatus />

        {/* Wallet Status Area */}
        <button 
            onClick={() => setWalletConnectModalOpen(true)}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${walletAddress ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
        >
            <Wallet size={16} />
            <div className="text-left hidden sm:block">
                <p className="text-[8px] font-black uppercase tracking-widest leading-none">
                    {walletAddress ? 'Vault Link Active' : 'Link Web3 Vault'}
                </p>
                {walletAddress && (
                    <p className="text-[10px] font-mono font-bold mt-1">
                        {ethBalance} ETH
                    </p>
                )}
            </div>
        </button>
        
        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5 gap-1">
            <button 
              className={`p-2 rounded-full transition-all ${isSyncing ? 'text-cyan-400' : 'text-gray-500 hover:text-cyan-400'}`}
              title="Neural Sync"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <div className="relative">
                <button className={`p-2 rounded-full transition-all ${unreadCount > 0 ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
                  )}
                </button>
            </div>
        </div>

        <button onClick={() => setActiveView(View.Settings)} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 p-[1px] shadow-lg group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#020617] rounded-[15px] flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-lime-400" />
                </div>
            </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
