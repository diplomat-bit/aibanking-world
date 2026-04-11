import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Bitcoin, Zap, Shield, Cpu, Wallet } from 'lucide-react';
import { walletService } from '../services/WalletService';
import { BrowserProvider } from 'ethers';

const CryptoView: React.FC = () => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { assets, simulationData } = context;

  const cryptoAssets = React.useMemo(() => assets.filter(a => a.assetClass === 'CRYPTO'), [assets]);
  const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444'];

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const updateWalletInfo = async (provider: any) => {
    try {
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      
      const balance = await browserProvider.getBalance(address);
      // Convert from Wei to ETH
      const ethBalance = Number(balance) / 1e18;
      setWalletBalance(ethBalance.toFixed(4));
    } catch (error) {
      console.error("Error updating wallet info:", error);
    }
  };

  const connectMetaMask = async () => {
    try {
      setIsConnecting(true);
      const session = await walletService.connect();
      await updateWalletInfo(session.connector.provider);
    } catch (error) {
      console.error("Connection error:", error);
      alert('Failed to connect wallet. Ensure MetaMask is installed and unlocked.');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const provider = walletService.getSession();
    if (provider) {
      updateWalletInfo(provider);
    }
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bitcoin className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-mono text-orange-400 uppercase tracking-[0.3em]">DLT Liquidity Node 7x</h2>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter">Crypto & Web3</h1>
        </div>
        <div className="flex gap-4">
           {walletAddress ? (
             <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-right flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-orange-400 font-black uppercase mb-1">Connected Wallet</p>
                  <p className="text-sm font-mono text-white font-bold">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                </div>
                <div className="h-8 w-px bg-orange-500/30"></div>
                <div>
                  <p className="text-[10px] text-orange-400 font-black uppercase mb-1">Balance</p>
                  <p className="text-sm font-mono text-white font-bold">{walletBalance} ETH</p>
                </div>
             </div>
           ) : (
             <button 
               onClick={connectMetaMask}
               disabled={isConnecting}
               className="flex items-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-2xl transition-all disabled:opacity-50"
             >
               <Wallet size={20} />
               {isConnecting ? 'CONNECTING...' : 'CONNECT METAMASK'}
             </button>
           )}
           <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl text-right hidden md:block">
              <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total Web3 Exposure</p>
              <p className="text-xl font-mono text-white font-bold">$1,242,500.42</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
           <Card title="Global Crypto Sentiment" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={simulationData}>
                    <defs>
                      <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorOrange)" />
                 </AreaChart>
              </ResponsiveContainer>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card title="Smart Contract Health" icon={<Shield className="w-5 h-5 text-green-400" />}>
                 <div className="space-y-4 pt-2">
                    {['L1 Consensus', 'Cross-chain Bridge', 'DEX Liquidity', 'Oracle Sync'].map(label => (
                      <div key={label} className="flex justify-between items-center p-3 bg-gray-950 rounded-xl border border-gray-800">
                         <span className="text-sm font-medium text-gray-400">{label}</span>
                         <span className="text-xs font-mono text-green-400 font-bold uppercase">Safe</span>
                      </div>
                    ))}
                 </div>
              </Card>

              <Card title="Mining & Staking Hash" icon={<Zap className="w-5 h-5 text-yellow-400" />}>
                 <div className="flex flex-col items-center justify-center h-full py-6 space-y-4">
                    <div className="text-4xl font-black text-white font-mono">14.2 EH/s</div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Pooled Network Power</p>
                 </div>
              </Card>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
           <Card title="Asset Distribution">
              <div className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       {/* Fix: Recharts Pie data typing cast */}
                       <Pie data={cryptoAssets as any[]} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none">
                          {cryptoAssets.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                       </Pie>
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                 {cryptoAssets.map((asset, i) => (
                    <div key={asset.id} className="flex justify-between items-center p-3 bg-gray-900 border border-gray-800 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                          <span className="text-sm font-bold text-white">{asset.name}</span>
                       </div>
                       <span className="text-xs font-mono text-gray-400">${asset.value.toLocaleString()}</span>
                    </div>
                 ))}
              </div>
           </Card>

           <Card title="On-Chain Directives" icon={<Cpu className="w-5 h-5 text-cyan-400" />}>
              <div className="space-y-4 pt-2">
                 <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                    <p className="text-xs text-orange-300 italic leading-relaxed">"Neural Core: High volatility in DeFi yield aggregators detected. Suggest migrating 12% of USDC pool to Aave v4."</p>
                 </div>
                 <button className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black tracking-widest rounded-2xl transition-all shadow-lg shadow-orange-500/20">
                    EXECUTE REBALANCE
                 </button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default CryptoView;