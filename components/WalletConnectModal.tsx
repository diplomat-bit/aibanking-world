
import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { FaWallet, FaTimes, FaLink, FaShieldAlt } from 'react-icons/fa';

const WalletConnectModal: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) return null;
    const { isWalletConnectModalOpen, setWalletConnectModalOpen, connectWallet, walletAddress } = context;

    const [isConnecting, setIsConnecting] = useState(false);

    if (!isWalletConnectModalOpen) return null;

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await connectWallet();
            setWalletConnectModalOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setWalletConnectModalOpen(false)}>
            <div className="bg-[#020617] rounded-[3rem] border border-white/10 shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gray-950/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                            <FaWallet size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tighter">METAMASK LINK</h3>
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Protocol: MetaMask Injected</p>
                        </div>
                    </div>
                    <button onClick={() => setWalletConnectModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-10 space-y-8">
                    <div className="text-center space-y-4">
                        <div className="relative inline-block">
                           <div className="w-24 h-24 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mx-auto">
                              <FaLink size={32} className={`text-cyan-400 ${isConnecting ? 'animate-pulse' : ''}`} />
                           </div>
                           <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-green-500 border-4 border-[#020617] animate-ping" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-white uppercase">Establish Secure Handshake</h4>
                            <p className="text-sm text-gray-500 font-light leading-relaxed px-4">
                                Connect your mobile or desktop wallet to authorize high-magnitude asset transmissions.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black tracking-[0.3em] uppercase rounded-2xl transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isConnecting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    SYNCING...
                                </>
                            ) : (
                                "INITIALIZE HANDSHAKE"
                            )}
                        </button>
                        
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <FaShieldAlt className="text-gray-500 shrink-0" />
                            <p className="text-[10px] text-gray-500 uppercase font-black leading-relaxed">
                                Your private keys never leave your secure device. This OS only requests signature authority.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-950/80 border-t border-white/5 text-center">
                    <p className="text-[10px] font-mono text-gray-700 tracking-[0.5em] uppercase">Project_ID: 851359...dac2</p>
                </div>
            </div>
        </div>
    );
};

export default WalletConnectModal;
