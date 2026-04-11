import React, { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { Activity, Database, Shield, Zap } from 'lucide-react';

const GlobalLedgerView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Global Ledger</h1>
                <p className="text-gray-400">Distributed transaction consensus and immutable record keeping.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-400">Total Volume</h3>
                        <Activity className="text-cyan-400" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        ${context.transactions.reduce((acc, tx) => acc + tx.amount, 0).toLocaleString()}
                    </div>
                </div>
                
                <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-400">Network Nodes</h3>
                        <Database className="text-purple-400" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {context.internalAccounts.length + 12} Active
                    </div>
                </div>

                <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-400">Consensus Status</h3>
                        <Shield className="text-green-400" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        Secured
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="text-cyan-400" size={20} />
                    Recent Blocks
                </h2>
                <div className="space-y-4">
                    {context.transactions.slice(0, 5).map((tx, idx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                            <div>
                                <div className="text-sm font-medium text-white">{tx.description}</div>
                                <div className="text-xs text-gray-500 font-mono mt-1">Hash: 0x{Math.random().toString(16).slice(2, 10)}...</div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{new Date(tx.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GlobalLedgerView;
