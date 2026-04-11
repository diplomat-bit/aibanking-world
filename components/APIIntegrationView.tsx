import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { APIStatus } from '../types';
import Card from './Card';
import { ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts';


function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

const APIIntegrationView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("APIIntegrationView must be within a DataProvider.");
    
    const { 
        apiStatus, 
        modernTreasuryApiKey, setModernTreasuryApiKey,
        modernTreasuryOrganizationId, setModernTreasuryOrganizationId
    } = context;

    const [isMtModalOpen, setIsMtModalOpen] = useState(false);
    const [mtApiKeyInput, setMtApiKeyInput] = useState(modernTreasuryApiKey || '');
    const [mtOrgIdInput, setMtOrgIdInput] = useState(modernTreasuryOrganizationId || '');

    const handleSaveMtKey = () => {
        setModernTreasuryApiKey(mtApiKeyInput);
        setModernTreasuryOrganizationId(mtOrgIdInput);
        setIsMtModalOpen(false);
    };

    const StatusIndicator: React.FC<{ status: APIStatus['status'] }> = ({ status }) => {
        const colors = {
            'Operational': { bg: 'bg-green-500/20', text: 'text-green-300', dot: 'bg-green-400' },
            'Degraded Performance': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400' },
            'Partial Outage': { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-400' },
            'Major Outage': { bg: 'bg-red-500/20', text: 'text-red-300', dot: 'bg-red-400' },
        };
        const style = colors[status];
        return (
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
                {status}
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">API Integrations</h1>
                <button 
                    onClick={() => setIsMtModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <SettingsIcon className="w-4 h-4" />
                    Configure Modern Treasury
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apiStatus.map((api) => (
                    <Card key={api.id} className="p-6 bg-gray-900/50 border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{api.name}</h3>
                                <p className="text-sm text-gray-400">{api.description}</p>
                            </div>
                            <StatusIndicator status={api.status} />
                        </div>
                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={api.latencyHistory}>
                                    <Area 
                                        type="monotone" 
                                        dataKey="latency" 
                                        stroke="#3b82f6" 
                                        fill="#3b82f622" 
                                        strokeWidth={2} 
                                    />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#3b82f6' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                            <span>Last 24h Latency</span>
                            <span>{api.latencyHistory[api.latencyHistory.length - 1]?.latency}ms</span>
                        </div>
                    </Card>
                ))}
            </div>

            {isMtModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-8 bg-gray-900 border-gray-800">
                        <h2 className="text-2xl font-bold text-white mb-6">Modern Treasury Config</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                                <input 
                                    type="password"
                                    value={mtApiKeyInput}
                                    onChange={(e) => setMtApiKeyInput(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="sk_live_..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Organization ID</label>
                                <input 
                                    type="text"
                                    value={mtOrgIdInput}
                                    onChange={(e) => setMtOrgIdInput(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="org_..."
                                />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button 
                                    onClick={() => setIsMtModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveMtKey}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    Save Config
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default APIIntegrationView;
