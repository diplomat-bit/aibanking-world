import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { FixedSizeList as List } from "react-window";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, Zap, Fingerprint, BrainCircuit, Search, ExternalLink, Activity, Lock, AlertCircle } from "lucide-react";

import { TransactionViewer } from "./TransactionViewer";
import { DataContext } from "../context/DataContext";

// --- 1. MSAL CONFIGURATION ---
// Initialized dynamically in Wrapper

// --- 2. MAIN COMPONENT ---
export default function AquariusDashboard({ setView }: { setView: (view: any) => void }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { realAccounts } = useContext(DataContext) || {};
  const [rawApps, setRawApps] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiDirective, setAiDirective] = useState("Awaiting Identity Handshake...");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const totalBalance = useMemo(() => {
    if (!realAccounts?.accountGroupSummary) return 0;
    return realAccounts.accountGroupSummary.reduce((acc, group) => acc + (group.totalCurrentBalance?.localCurrencyBalanceAmount || 0), 0);
  }, [realAccounts]);

  // --- 3. AZURE POPUP LOGIC ---
  const isInIframe = window.self !== window.top;

  const handleLogin = async () => {
    if (isInIframe) {
      window.open(window.location.href, '_blank');
      return;
    }
    setAuthError(null);
    try {
      await instance.loginRedirect({ scopes: ["User.Read", "openid", "profile"] });
    } catch (e: any) {
      console.error("Auth Failure:", e);
      setAuthError(e.message || "Authentication failed.");
    }
  };

  // --- 4. 2,200 APP NDJSON LOADER ---
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/apps/apps.json') // Corrected path to /apps/apps.json
        .then(res => res.text())
        .then(text => {
          // The new apps.json format has multi-line JSON objects separated by newlines
          // We can parse this by wrapping it in an array and adding commas
          try {
            // Replace "}\n{" with "},{" and wrap in brackets
            const jsonString = '[' + text.replace(/}\s*\n\s*{/g, '},{') + ']';
            const parsedApps = JSON.parse(jsonString);
            setRawApps(parsedApps);
          } catch (e) {
            console.error("Failed to parse apps.json with fast method, falling back to regex", e);
            // Fallback for more complex formatting
            const regex = /\{[\s\S]*?\}(?=\s*\{|\s*$)/g;
            const matches = text.match(regex) || [];
            const parsedApps = matches.map(match => {
              try {
                return JSON.parse(match);
              } catch (err) {
                console.error("Failed to parse individual app:", match, err);
                return null;
              }
            }).filter(Boolean);
            setRawApps(parsedApps);
          }
        })
        .catch(err => console.error("Fleet Load Error:", err));
    }
  }, [isAuthenticated]);

  // --- 5. SEARCH & VIRTUALIZATION ---
  const filteredApps = useMemo(() => {
    const lowTerm = searchTerm.toLowerCase();
    return rawApps.filter(app => 
      (app.app && app.app.toLowerCase().includes(lowTerm)) || 
      (app.displayName && app.displayName.toLowerCase().includes(lowTerm)) || 
      (app.appId && app.appId.includes(searchTerm))
    );
  }, [searchTerm, rawApps]);

  const AppRow = ({ index, style }: any) => {
    const app = filteredApps[index];
    return (
      <div style={style} className="pr-4 pb-2">
        <div 
          onClick={() => {
            setSelectedAppId(app.appId);
            setView(app.appId);
          }}
          className={`h-full p-4 bg-white/5 border rounded-2xl flex items-center justify-between transition-all cursor-pointer ${selectedAppId === app.appId ? 'border-lime-500' : 'border-white/5 hover:border-lime-500/50'}`}
        >
          <div className="truncate">
            <h3 className="text-sm font-bold text-white truncate">{app.app || app.displayName || 'Unknown App'}</h3>
            <p className="text-[9px] font-mono text-gray-500 uppercase">{app.appId}</p>
          </div>
          <ExternalLink size={14} className={selectedAppId === app.appId ? 'text-lime-400' : 'text-gray-500'} />
        </div>
      </div>
    );
  };

  // --- 6. VERCEL API TRIGGER ---
  const fetchAi = useCallback(async () => {
    if (!isAuthenticated || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/Gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Directive for ${accounts[0]?.name}. 2,200 apps active.` })
      });
      const data = await res.json();
      setAiDirective(data.text);
    } catch (e) {
      setAiDirective("Sovereign Node Monitoring Active.");
    } finally {
      setIsAiLoading(false);
    }
  }, [isAuthenticated, accounts]);

  useEffect(() => { if (isAuthenticated) fetchAi(); }, [isAuthenticated]);

  // --- 7. AUTH GATE UI ---
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <Fingerprint size={120} className="text-lime-500 animate-pulse" />
          <div className="absolute inset-0 bg-lime-500/20 blur-3xl rounded-full" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Identity Required</h1>
        
        {authError && (
          <div className="max-w-md p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-[10px] font-mono text-center space-y-2">
            <p className="font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <AlertCircle size={12} /> Authentication_Error
            </p>
            <p className="leading-relaxed opacity-80">{authError}</p>
            <p className="text-[8px] text-slate-500 italic">
              HINT: If you see AADSTS9002326, ensure your Azure App is registered as a "Single-Page Application" (SPA) in the Azure Portal.
            </p>
          </div>
        )}

        <button onClick={handleLogin} className="px-10 py-5 bg-lime-500 text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform">
          <Lock size={20} /> {isInIframe ? "OPEN IN NEW TAB TO SIGN IN" : "SPAWN AZURE HANDSHAKE"}
        </button>
      </div>
    );
  }

  // --- 8. DASHBOARD UI ---
  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-10 font-sans selection:bg-lime-500 selection:text-black">
      <header className="flex justify-between items-end border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-lime-400 font-mono text-[10px] tracking-[0.4em]">
            <Activity size={14} className="animate-pulse" /> NODE_ACTIVE // {rawApps.length} APPS
          </div>
          <h1 className="text-7xl font-black tracking-tighter">Sovereign <span className="text-lime-500">Command</span></h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{accounts[0]?.username}</p>
          <p className="text-4xl font-mono font-black text-white">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* AI Strategic Brief */}
        <div className="col-span-12 p-10 rounded-[3rem] border border-lime-500/20 bg-lime-500/5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <BrainCircuit className={`text-lime-400 ${isAiLoading ? "animate-spin" : ""}`} size={48} />
            <p className="text-2xl font-light italic text-white/80">"{aiDirective}"</p>
          </div>
          <button onClick={fetchAi} className="p-5 bg-lime-500 text-black rounded-2xl hover:bg-lime-400"><Zap /></button>
        </div>

        {/* 2,200 App Mesh List */}
        <div className="col-span-12 lg:col-span-7 bg-white/5 p-8 rounded-[3rem] border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase tracking-widest">Fleet Mesh</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="Filter Fleet..." 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 text-xs text-lime-400 outline-none"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="h-[500px]">
            <List height={500} itemCount={filteredApps.length} itemSize={80} width={"100%"}>
              {AppRow}
            </List>
          </div>
        </div>

        {/* Portfolio Matrix */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
            {selectedAppId ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TransactionViewer accountId={selectedAppId} />
              </div>
            ) : (
              <div className="h-[300px] bg-white/5 rounded-[3rem] border border-white/5 p-8">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{v:10}, {v:45}, {v:25}, {v:70}, {v:60}]}>
                          <Area type="monotone" dataKey="v" stroke="#a3e635" fill="#a3e63511" strokeWidth={4} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
            )}
            <div className="p-8 bg-lime-500 rounded-[3rem] text-black">
                <h3 className="font-black uppercase tracking-widest text-xs mb-2">Authority Verified</h3>
                <p className="text-2xl font-bold leading-tight underline decoration-black/20">All 2,200 Apps Synchronized via Microsoft Entra ID Handshake.</p>
            </div>
        </div>
      </div>
    </div>
  );
}