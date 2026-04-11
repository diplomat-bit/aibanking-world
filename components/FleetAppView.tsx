import React, { useState, useEffect, useContext } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { 
  Shield, 
  Activity, 
  Lock, 
  AlertCircle, 
  ArrowLeft, 
  Cpu, 
  Globe, 
  Database,
  Fingerprint,
  Zap
} from "lucide-react";
import { TransactionViewer } from "./TransactionViewer";
import { DataContext } from "../context/DataContext";
import { View } from "../types";

interface FleetAppViewProps {
  appId: string;
  setView: (view: any) => void;
}

export default function FleetAppView({ appId, setView }: FleetAppViewProps) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch('/api/v1/azure-apps');
        const data = await res.json();
        const found = (data.apps || []).find((a: any) => a.appId === appId);
        setAppData(found);
      } catch (e) {
        console.error("Failed to fetch app data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appId]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await instance.loginPopup({ scopes: ["User.Read", "openid", "profile"] });
    } catch (e: any) {
      console.error("Auth Failure:", e);
      setAuthError(e.message || "Authentication failed.");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-lime-500 font-mono text-xs animate-pulse flex items-center gap-2">
          <Cpu className="animate-spin" size={16} /> INITIALIZING_APP_PROTOCOL...
        </div>
      </div>
    );
  }

  const handleCitiConnect = async () => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.code) {
        window.removeEventListener('message', handleMessage);
        const code = event.data.code;
        const host = window.location.host;
        const redirectUri = `https://${host}/citi/callback`;

        try {
          const tokenRes = await fetch('/api/v1/citi/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri })
          });
          
          if (!tokenRes.ok) throw new Error('Token exchange failed');
          const tokenData = await tokenRes.json();
          
          // Now fetch accounts
          const accountsRes = await fetch('/api/v1/citi/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: tokenData.access_token })
          });
          
          if (!accountsRes.ok) throw new Error('Account discovery failed');
          const accountsData = await accountsRes.json();
          console.log('Citi Accounts Discovered:', accountsData);
          alert('Citi Neural Handshake Complete. Accounts Synchronized.');
        } catch (err) {
          console.error('Handshake failure:', err);
          alert('Neural Handshake Failed. Verify App Registration.');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    try {
      const response = await fetch('/api/v1/citi/auth-url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) alert('Please allow popups for this site to connect your account.');
    } catch (error) {
      console.error('Citi OAuth error:', error);
    }
  };

  if (appId === 'citi-cash-node-001') {
    return (
      <div className="h-full bg-black text-white space-y-8 p-8 border border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <Zap size={80} className="text-lime-500 animate-pulse" />
          <div className="absolute inset-0 bg-lime-500/20 blur-3xl rounded-full" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Citi Neural <span className="text-lime-500">Cash Ingest</span></h1>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest max-w-md mb-8">
          This node requires a direct handshake with the Citi Developer Portal. 
          The application must be registered to authorize account discovery.
        </p>
        <button onClick={handleCitiConnect} className="px-10 py-5 bg-lime-500 text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform">
          <Shield size={20} /> INITIATE CITI HANDSHAKE
        </button>
        <button 
          onClick={() => setView(View.Dashboard)}
          className="mt-8 text-gray-500 hover:text-white transition-colors font-mono text-[10px] uppercase tracking-[0.3em]"
        >
          Back to Command
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center space-y-8 p-8 border border-white/5 rounded-[3rem]">
        <div className="relative">
          <Fingerprint size={80} className="text-lime-500 animate-pulse" />
          <div className="absolute inset-0 bg-lime-500/20 blur-3xl rounded-full" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Azure Handshake Required</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Target: {appData?.app || appId}</p>
        </div>
        
        {authError && (
          <div className="max-w-md p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-[10px] font-mono text-center">
            <p className="font-bold uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
              <AlertCircle size={12} /> Auth_Error
            </p>
            <p className="opacity-80">{authError}</p>
          </div>
        )}

        <button onClick={handleLogin} className="px-8 py-4 bg-lime-500 text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform">
          <Lock size={18} /> AUTHORIZE_ACCESS
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setView(View.Dashboard)}
          className="flex items-center gap-2 text-gray-500 hover:text-lime-400 transition-colors font-mono text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Back to Command
        </button>
        <div className="flex items-center gap-2 text-lime-500 font-mono text-[10px] tracking-widest uppercase">
          <Activity size={12} className="animate-pulse" /> Connection_Secure
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* App Info Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-lime-500/20 rounded-2xl flex items-center justify-center text-lime-400 mb-6">
                <Globe size={24} />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">{appData?.app || "Unknown Service"}</h1>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">{appId}</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Principal</span>
                  <span className="text-xs font-mono text-lime-400">{appData?.servicePrincipal || "Verified"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Owner</span>
                  <span className="text-xs font-mono text-lime-400">{appData?.owner || "System"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-lime-500 rounded-[2.5rem] text-black">
            <div className="flex items-center gap-3 mb-4">
              <Database size={20} />
              <h3 className="font-black uppercase tracking-widest text-xs">Node Intelligence</h3>
            </div>
            <p className="text-lg font-bold leading-tight italic">
              "This node is currently synchronized with the Global Ledger. All transactions are being monitored by the Sovereign AI."
            </p>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-2">
            <TransactionViewer accountId={appId} />
          </div>
        </div>
      </div>
    </div>
  );
}
