import React, { useState } from 'react';
import { CreditCard, Building, Wallet, Plus, CheckCircle, AlertCircle, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

interface PaymentMethod {
    id: string;
    type: 'stripe' | 'paypal' | 'ach';
    name: string;
    details: string;
    status: 'active' | 'pending' | 'failed';
    isDefault: boolean;
}

const PaymentMethodsView: React.FC = () => {
    const [methods, setMethods] = useState<PaymentMethod[]>([
        { id: 'pm_1', type: 'stripe', name: 'Stripe Credit Card', details: 'Visa ending in 4242', status: 'active', isDefault: true },
        { id: 'pm_2', type: 'paypal', name: 'PayPal Account', details: 'user@example.com', status: 'active', isDefault: false },
        { id: 'pm_3', type: 'ach', name: 'Chase Checking', details: 'Account ending in 9876', status: 'pending', isDefault: false },
    ]);

    const [isLinking, setIsLinking] = useState<string | null>(null);

    const handleLinkMethod = (type: 'stripe' | 'paypal' | 'ach') => {
        setIsLinking(type);
        // Simulate linking process
        setTimeout(() => {
            const newMethod: PaymentMethod = {
                id: `pm_${Date.now()}`,
                type,
                name: type === 'stripe' ? 'New Credit Card' : type === 'paypal' ? 'New PayPal' : 'New Bank Account',
                details: type === 'stripe' ? 'Mastercard ending in 1234' : type === 'paypal' ? 'new@example.com' : 'Account ending in 5555',
                status: 'active',
                isDefault: methods.length === 0
            };
            setMethods([...methods, newMethod]);
            setIsLinking(null);
        }, 1500);
    };

    const handleSetDefault = (id: string) => {
        setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
    };

    const handleRemove = (id: string) => {
        setMethods(methods.filter(m => m.id !== id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'stripe': return <CreditCard className="text-indigo-400" size={24} />;
            case 'paypal': return <Wallet className="text-blue-400" size={24} />;
            case 'ach': return <Building className="text-green-400" size={24} />;
            default: return <CreditCard className="text-gray-400" size={24} />;
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Payment Gateways</h1>
                <p className="text-gray-400">Manage your linked payment methods for seamless transactions across the Sovereign network.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-cyan-400" size={20} />
                            Linked Methods
                        </h2>
                        
                        {methods.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="mx-auto text-gray-500 mb-3" size={32} />
                                <p className="text-gray-400">No payment methods linked yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {methods.map(method => (
                                    <div key={method.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${method.isDefault ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                {getIcon(method.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-white">{method.name}</h3>
                                                    {method.isDefault && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-400">Default</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">{method.details}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 sm:ml-4">
                                            {method.status === 'pending' && (
                                                <span className="text-xs text-orange-400 flex items-center gap-1">
                                                    <AlertCircle size={12} /> Verification Pending
                                                </span>
                                            )}
                                            {!method.isDefault && method.status === 'active' && (
                                                <button 
                                                    onClick={() => handleSetDefault(method.id)}
                                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Set Default
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleRemove(method.id)}
                                                className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                        <h2 className="text-lg font-bold text-white mb-4">Add New Method</h2>
                        <div className="space-y-3">
                            <button 
                                onClick={() => handleLinkMethod('stripe')}
                                disabled={isLinking !== null}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <CreditCard className="text-indigo-400" size={20} />
                                    <span className="text-sm font-medium text-white">Credit / Debit Card</span>
                                </div>
                                {isLinking === 'stripe' ? <RefreshCw className="animate-spin text-indigo-400" size={16} /> : <Plus className="text-indigo-400 group-hover:scale-110 transition-transform" size={16} />}
                            </button>

                            <button 
                                onClick={() => handleLinkMethod('paypal')}
                                disabled={isLinking !== null}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Wallet className="text-blue-400" size={20} />
                                    <span className="text-sm font-medium text-white">PayPal</span>
                                </div>
                                {isLinking === 'paypal' ? <RefreshCw className="animate-spin text-blue-400" size={16} /> : <Plus className="text-blue-400 group-hover:scale-110 transition-transform" size={16} />}
                            </button>

                            <button 
                                onClick={() => handleLinkMethod('ach')}
                                disabled={isLinking !== null}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Building className="text-green-400" size={20} />
                                    <span className="text-sm font-medium text-white">Bank Account (ACH)</span>
                                </div>
                                {isLinking === 'ach' ? <RefreshCw className="animate-spin text-green-400" size={16} /> : <Plus className="text-green-400 group-hover:scale-110 transition-transform" size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <ShieldCheck className="text-green-400" size={16} />
                            Bank-Grade Security
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Your payment information is encrypted and securely stored by our payment partners. We never store your full card details or bank credentials on our servers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodsView;
