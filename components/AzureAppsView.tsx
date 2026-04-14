import React, { useState, useEffect, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { 
  Shield, 
  Activity, 
  Search, 
  ExternalLink, 
  Cpu, 
  Fingerprint, 
  Lock, 
  AlertCircle,
  Globe,
  Database
} from 'lucide-react';
import { FixedSizeList as List } from "react-window";
import FleetAppView from './FleetAppView';

interface AzureApp {
  app: string;
  appId: string;
  servicePrincipal: string;
  owner: string;
}

interface AzureAppsViewProps {
  setView?: (view: any) => void;
}

const AzureAppsView: React.FC<AzureAppsViewProps> = ({ setView }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [apps, setApps] = useState<AzureApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await fetch('/api/v1/azure-apps');
        const data = await response.json();
        setApps(data.apps || []);
      } catch (error) {
        console.error('Failed to fetch Azure apps:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

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

  const filteredApps = useMemo(() => {
    const lowTerm = search.toLowerCase();
    return apps.filter(app => 
      (app.app && app.app.toLowerCase().includes(lowTerm)) || 
      (app.appId && app.appId.includes(search))
    );
  }, [search, apps]);

  const handleAppSelect = (appId: string) => {
    if (setView) {
      setView(appId);
    } else {
      setSelectedAppId(appId);
    }
  };

  const AppRow = ({ index, style }: any) => {
    const app = filteredApps[index];
    return (
      <div style={style} className="pr-4 pb-2">
        <div 
          onClick={() => handleAppSelect(app.appId)}
          className={`h-full p-4 bg-white/5 border rounded-2xl flex items-center justify-between transition-all cursor-pointer ${selectedAppId === app.appId ? 'border-lime-500' : 'border-white/5 hover:border-lime-500/50'}`}
        >
          <div className="truncate">
            <h3 className="text-sm font-bold text-white truncate">{app.app}</h3>
            <p className="text-[9px] font-mono text-gray-500 uppercase">{app.appId}</p>
          </div>
          <ExternalLink size={14} className={selectedAppId === app.appId ? 'text-lime-400' : 'text-gray-500'} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-lime-500 font-mono text-xs animate-pulse flex items-center gap-2">
          <Cpu className="animate-spin" size={16} /> SYNCHRONIZING_FLEET_MESH...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center space-y-8 p-8 border border-white/5 rounded-[3rem]">
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
          </div>
        )}

        <button onClick={handleLogin} className="px-10 py-5 bg-lime-500 text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform">
          <Lock size={20} /> {isInIframe ? "OPEN IN NEW TAB TO SIGN IN" : "SPAWN AZURE HANDSHAKE"}
        </button>
      </div>
    );
  }

  if (selectedAppId) {
    return <FleetAppView appId={selectedAppId} setView={() => setSelectedAppId(null)} />;
  }

  return (
    <div className="h-full bg-black text-white p-8 space-y-10 font-sans selection:bg-lime-500 selection:text-black overflow-hidden flex flex-col">
      <header className="flex justify-between items-end border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-lime-400 font-mono text-[10px] tracking-[0.4em]">
            <Activity size={14} className="animate-pulse" /> FLEET_MESH_ACTIVE // {apps.length} NODES
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase">Azure <span className="text-lime-500">Directory</span></h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{accounts[0]?.username}</p>
          <div className="flex items-center gap-2 text-lime-500 font-mono text-xs mt-1">
            <Shield size={14} /> AUTHORITY_VERIFIED
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        {/* Fleet List */}
        <div className="col-span-12 lg:col-span-8 bg-white/5 p-8 rounded-[3rem] border border-white/5 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase tracking-widest">Fleet Mesh</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="Filter Fleet..." 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 text-xs text-lime-400 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <List height={500} itemCount={filteredApps.length} itemSize={80} width={"100%"}>
              {AppRow}
            </List>
          </div>
        </div>

        {/* Stats & Info */}
        <div className="col-span-12 lg:col-span-4 space-y-8 overflow-y-auto custom-scrollbar pr-2">
          <div className="p-8 bg-white/5 border border-white/5 rounded-[3rem] space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-400">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Global Reach</h3>
                <p className="text-xs text-gray-500 font-mono uppercase">2,200+ Synchronized Nodes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                <Database size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Data Integrity</h3>
                <p className="text-xs text-gray-500 font-mono uppercase">AES-256-GCM Encryption</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-lime-500 rounded-[3rem] text-black">
            <h3 className="font-black uppercase tracking-widest text-xs mb-2">Sovereign Directive</h3>
            <p className="text-2xl font-bold leading-tight italic">
              "All enterprise applications are now under the command of the Sovereign AI. Handshake protocols are active."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AzureAppsView;
