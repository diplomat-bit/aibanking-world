
import React, { useState, useContext, useMemo, useEffect } from 'react';
import TabManager from './components/TabManager';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth0 } from '@auth0/auth0-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SovereignIframe from './components/SovereignIframe';
import ErrorBoundary from './components/ErrorBoundary';
import { signInWithGoogleCredential } from './firebase';

// App Views
import AquariusDashboard from './components/AquariusDashboard';
import AquariusArchitectView from './components/AquariusArchitectView';
import AquariusGhostView from './components/AquariusGhostView';
import AquariusCreativeSuite from './components/AquariusCreativeSuite';
import AquariusLiveVoice from './components/AquariusLiveVoice';
import AquariusAuditorView from './components/AquariusAuditorView';
import GeminiLivePortal from './components/GeminiLivePortal';
import IdentityCitadelView from './components/IdentityCitadelView';
import RecoveryMeshView from './components/RecoveryMeshView';
import PrivacyGuardianView from './components/PrivacyGuardianView';
import TrustRegistryView from './components/TrustRegistryView';
import FlowController from './components/FlowController';
import GrowthNexus from './components/GrowthNexus';
import TokenIssuanceView from './components/TokenIssuanceView';
import MarketingAutomationView from './components/MarketingAutomationView';
import AquariusInstitutionalHub from './components/AquariusInstitutionalHub';
import IntelligenceHubView from './components/IntelligenceHubView';
import NexusBuilder from './components/NexusBuilder';
import IntegrationsMarketplaceView from './components/IntegrationsMarketplaceView';
import SettingsView from './components/SettingsView';
import DataIngestView from './components/DataIngestView';
import TheVisionView from './components/TheVisionView';
import RewardsView from './components/RewardsView';
import PortalHubView from './components/PortalHubView';
import NeuralToolsView from './components/NeuralToolsView';
import BillingIdentityView from './components/BillingIdentityView';
import AzureAppsView from './components/AzureAppsView';
import FleetAppView from './components/FleetAppView';

import SovereignOrgHandshake from './components/SovereignOrgHandshake';
import GlobalLedgerView from './components/GlobalLedgerView';
import TransactionsView from './components/TransactionsView';
import SendMoneyView from './components/SendMoneyView';
import BudgetsView from './components/BudgetsView';
import GoalsView from './components/GoalsView';
import TradingBotsView from './components/TradingBotsView';
import APIKeysView from './components/APIKeysView';
import PaymentMethodsView from './components/PaymentMethodsView';
import WealthNexusView from './components/WealthNexusView';
import InvestmentsView from './components/InvestmentsView';
import QuantumWeaverView from './components/QuantumWeaverView';
import CryptoView from './components/CryptoView';
import InvestmentPortfolio from './components/InvestmentPortfolio';
import { View, AppView } from './types';
import { DataContext } from './context/DataContext';
import { useFirebase } from './context/FirebaseContext';
import { SOVEREIGN_APPS } from './constants';
import { lastBossService } from './services/LastBossService';

const COMPONENT_MAP: Record<string, { component: React.ComponentType<any>, moduleCode: string, label: string, isProtected?: boolean }> = {
    [View.Dashboard]: { component: AquariusDashboard, moduleCode: 'AQ-CMD-01', label: 'Executive Command' },
    [View.DataIngest]: { component: DataIngestView, moduleCode: 'AQ-ING-02', label: 'Neural Ingest', isProtected: true },
    [View.PortalHub]: { component: PortalHubView, moduleCode: 'AQ-HUB-99', label: 'Sovereign Portal Hub' },
    [View.BillingIdentity]: { component: BillingIdentityView, moduleCode: 'AQ-SEC-LB', label: 'Identity Vault' },
    [View.LegionArchitect]: { component: AquariusArchitectView, moduleCode: 'AQ-LG1-ARC', label: 'Legion I: Architect', isProtected: true },
    [View.LegionGhost]: { component: AquariusGhostView, moduleCode: 'AQ-LG2-GHS', label: 'Legion II: Ghost' },
    [View.LegionVisualizer]: { component: AquariusCreativeSuite, moduleCode: 'AQ-LG3-VIS', label: 'Legion III: Visualizer' },
    [View.LegionVoice]: { component: AquariusLiveVoice, moduleCode: 'AQ-LG4-VOC', label: 'Legion IV: Voice' },
    [View.LegionAuditor]: { component: AquariusAuditorView, moduleCode: 'AQ-LG5-AUD', label: 'Legion V: Auditor' },
    [View.LegionLive]: { component: GeminiLivePortal, moduleCode: 'AQ-LG6-LIV', label: 'Legion VI: Live' },
    [View.IdentityCitadel]: { component: IdentityCitadelView, moduleCode: 'AQ-SEC-CID', label: 'Identity Citadel' },
    [View.RecoveryMesh]: { component: RecoveryMeshView, moduleCode: 'AQ-SEC-MSH', label: 'Recovery Mesh' },
    [View.PrivacyGuardian]: { component: PrivacyGuardianView, moduleCode: 'AQ-SEC-GRD', label: 'Privacy Guardian' },
    [View.TrustRegistry]: { component: TrustRegistryView, moduleCode: 'AQ-SEC-REG', label: 'Trust Registry' },
    
    [View.GlobalLedger]: { component: GlobalLedgerView, moduleCode: 'AQ-OPS-GLD', label: 'Global Ledger' },
    [View.Transactions]: { component: TransactionsView, moduleCode: 'AQ-OPS-GLD', label: 'Global Ledger' },
    [View.SendMoney]: { component: SendMoneyView, moduleCode: 'AQ-OPS-GLD', label: 'Global Ledger' },
    [View.Budgets]: { component: BudgetsView, moduleCode: 'AQ-OPS-GLD', label: 'Global Ledger' },
    [View.Goals]: { component: GoalsView, moduleCode: 'AQ-OPS-GLD', label: 'Global Ledger' },
    
    [View.WealthNexus]: { component: WealthNexusView, moduleCode: 'AQ-GTH-NEX', label: 'Wealth Nexus' },
    [View.Investments]: { component: InvestmentsView, moduleCode: 'AQ-GTH-NEX', label: 'Wealth Nexus' },
    [View.Portfolio]: { component: InvestmentPortfolio, moduleCode: 'AQ-GTH-NEX', label: 'Wealth Nexus' },
    [View.QuantumWeaver]: { component: QuantumWeaverView, moduleCode: 'AQ-GTH-NEX', label: 'Wealth Nexus' },
    [View.Crypto]: { component: CryptoView, moduleCode: 'AQ-GTH-NEX', label: 'Wealth Nexus' },
    [View.TradingBots]: { component: TradingBotsView, moduleCode: 'AQ-GTH-NEX', label: 'Wealth Nexus' },
    [View.APIKeys]: { component: APIKeysView, moduleCode: 'AQ-SYS-SET', label: 'Core Settings' },
    [View.PaymentMethods]: { component: PaymentMethodsView, moduleCode: 'AQ-SYS-SET', label: 'Core Settings' },

    [View.TokenIssuance]: { component: TokenIssuanceView, moduleCode: 'AQ-GTH-TKN', label: 'Asset Forge' },
    [View.MarketingAutomation]: { component: MarketingAutomationView, moduleCode: 'AQ-GTH-MKT', label: 'Marketing Hub' },
    [View.InstitutionalHub]: { component: AquariusInstitutionalHub, moduleCode: 'AQ-OPS-HUB', label: 'Nexus Operations' },
    [View.IntelligenceHub]: { component: IntelligenceHubView, moduleCode: 'AQ-OPS-INT', label: 'Intelligence Hub' },
    [View.NeuralTools]: { component: NeuralToolsView, moduleCode: 'AQ-SYS-UTL', label: 'Neural Tools' },
    [View.NexusBuilder]: { component: NexusBuilder, moduleCode: 'AQ-OPS-FRG', label: 'Nexus Forge' },
    [View.IntegrationsMarketplace]: { component: IntegrationsMarketplaceView, moduleCode: 'AQ-OPS-MPK', label: 'Command Integrations' },
    [View.Settings]: { component: SettingsView, moduleCode: 'AQ-SYS-SET', label: 'Core Settings' },
    [View.TheVision]: { component: TheVisionView, moduleCode: 'AQ-SYS-VIS', label: 'The Vision' },
    [View.Rewards]: { component: RewardsView, moduleCode: 'AQ-SYS-REW', label: 'Rewards Hub' },
    [View.SovereignOrgHandshake]: { component: SovereignOrgHandshake, moduleCode: 'AQ-SEC-ORG', label: 'Org Handshake' },
    [View.AzureApps]: { component: AzureAppsView, moduleCode: 'AQ-AZR-APP', label: 'Azure Directory' }
};

const USERNAME = "admin08077";

const SpaceViewer: React.FC<{ appId: string }> = ({ appId }) => {
    const app = useMemo(() => SOVEREIGN_APPS.find(a => a.id === appId), [appId]);
    const url = useMemo(() => `https://${USERNAME}-${appId.toLowerCase().replace(/\s+/g, '-')}.static.hf.space`, [appId]);
    
    if (!app) return <div className="flex items-center justify-center h-full text-gray-500 font-mono">Module_Not_Found: {appId}</div>;

    return (
        <SovereignIframe title={app.name} moduleCode={`SPX-${appId.slice(0,3).toUpperCase()}`} src={url} />
    );
};

import { usePortal } from './context/PortalContext';
import PortalHandshake from './components/PortalHandshake';

const App: React.FC = () => {
    const context = useContext(DataContext);
    const { isAuthReady: isFirebaseReady } = useFirebase();
    const { isPortalAuthorized, setCitiLinked } = usePortal();
    
    const handleCitiConnect = async () => {
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

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.code) {
                setCitiLinked(true);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setCitiLinked]);
    
    if (!context) return null;

    const { view: contextView, setView: setContextView, user: userProfile } = context;
    const [view, setView] = useState<AppView>(contextView || View.Dashboard);
    
    useEffect(() => {
        setContextView(view);
    }, [view, setContextView]);
    const [openTabs, setOpenTabs] = useState<{id: string, name: string}[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isPaid = userProfile.app_metadata.is_pro && userProfile.app_metadata.subscription_status === 'active';

    const { isAuthenticated, loginWithRedirect, isLoading, user: auth0User } = useAuth0();

    // Initialize Last Boss Logic
    useEffect(() => {
        lastBossService.init(userProfile);
    }, [userProfile]);

    // --- PWA Protocol Handler Logic ---
    useEffect(() => {
        const handleSearch = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const portalParam = urlParams.get('portal');

            if (portalParam) {
                window.history.replaceState({}, document.title, window.location.pathname);
                const decoded = decodeURIComponent(portalParam);
                const match = decoded.match(/web\+aquarius:\/\/(.+)/i);
                const portalId = match ? match[1] : decoded;
                
                const found = SOVEREIGN_APPS.find(a => a.id === portalId || a.id.startsWith(portalId));
                if (found) {
                    setView(found.viewId || (found.id as AppView));
                }
            }
        };

        handleSearch();
        window.addEventListener('popstate', handleSearch);
        return () => window.removeEventListener('popstate', handleSearch);
    }, [setView]);

    const activeConfig = useMemo(() => {
        const isSystemView = COMPONENT_MAP[view];
        const isExternalApp = SOVEREIGN_APPS.find(a => a.id === view);

        if (isSystemView) {
            return isSystemView;
        }
        
        if (isExternalApp) {
            return {
                component: () => <SpaceViewer appId={isExternalApp.id} />,
                moduleCode: `EXT-${isExternalApp.id.slice(0,3).toUpperCase()}`,
                label: isExternalApp.name,
                isProtected: true
            };
        }

        // Check if it's an Azure App ID (UUID format)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(view)) {
            return {
                component: () => <FleetAppView appId={view} setView={setView} />,
                moduleCode: `FLEET-${view.slice(0, 4).toUpperCase()}`,
                label: 'Fleet Node',
                isProtected: true
            };
        }

        return COMPONENT_MAP[View.Dashboard];
    }, [view]);

    const ActiveComponent = activeConfig.component;

    if (isLoading || !isFirebaseReady) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div id="app-container" className="bg-[#020617] min-h-screen selection:bg-cyan-500/30">
             <div className="flex h-screen text-gray-200 overflow-hidden relative z-10 font-sans">
                <Sidebar 
                    activeView={view as View} 
                    setActiveView={setView} 
                    openTab={(id, name) => {
                        if (!openTabs.find(t => t.id === id)) {
                            setOpenTabs([...openTabs, {id, name}]);
                        }
                        setActiveTab(id);
                    }}
                    isOpen={isSidebarOpen} 
                    setIsOpen={setIsSidebarOpen} 
                />
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                    
                    <Header 
                        onMenuClick={() => setIsSidebarOpen(prev => !prev)} 
                        setActiveView={setContextView} 
                    />
                    
                    <TabManager 
                        tabs={openTabs} 
                        activeTab={activeTab} 
                        onTabClick={setActiveTab} 
                        onTabClose={(id) => setOpenTabs(prev => prev.filter(t => t.id !== id))} 
                    />
                    
                    <main className="flex-1 p-4 lg:p-8 relative overflow-hidden flex flex-col">
                        <div className="flex-1 w-full max-w-[1700px] mx-auto">
                            {activeTab ? (
                                <SpaceViewer appId={activeTab} />
                            ) : (
                                activeConfig.isProtected && !isAuthenticated ? (
                                    <div className="flex-1 h-full flex items-center justify-center flex-col gap-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-xl">
                                        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <h2 className="text-3xl text-white font-bold tracking-widest">VIEW PROTECTED</h2>
                                        <p className="text-cyan-500 font-mono">NEURAL HANDSHAKE REQUIRED</p>
                                        <button 
                                            onClick={() => loginWithRedirect()} 
                                            className="px-8 py-3 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 rounded hover:bg-cyan-600/40 hover:text-white transition-all font-mono uppercase tracking-wider"
                                        >
                                            Authenticate via Auth0
                                        </button>
                                    </div>
                                ) : activeConfig.isProtected && !isPaid ? (
                                    <BillingIdentityView />
                                ) : COMPONENT_MAP[view] || view === View.BillingIdentity ? (
                                    <SovereignIframe 
                                        title={activeConfig.label} 
                                        moduleCode={activeConfig.moduleCode}
                                    >
                                        <ActiveComponent openTab={(id: string, name: string) => {
                                            if (!openTabs.find(t => t.id === id)) {
                                                setOpenTabs([...openTabs, {id, name}]);
                                            }
                                            setActiveTab(id);
                                        }} setView={setContextView} />
                                    </SovereignIframe>
                                ) : (
                                    <ActiveComponent openTab={(id: string, name: string) => {
                                        if (!openTabs.find(t => t.id === id)) {
                                            setOpenTabs([...openTabs, {id, name}]);
                                        }
                                        setActiveTab(id);
                                    }} setView={setContextView} />
                                )
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-in { animation: fade-in 0.7s forwards; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite linear;
                }
            `}</style>
        </div>
        </ErrorBoundary>
    );
};

export default App;