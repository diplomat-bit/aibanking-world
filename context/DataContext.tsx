import React, { createContext, useState, useEffect, useCallback } from 'react';
import { accountService } from '../services/AccountService';
import { transactionService } from '../services/TransactionService';
import { 
  AppView, 
  UserProfile, 
  Transaction, 
  PortfolioAsset, 
  InternalAccount, 
  Notification, 
  AIInsight, 
  BudgetCategory, 
  RewardItem, 
  APIStatus,
  FinancialGoal,
  CreditScore,
  CreditFactor,
  PaymentOrder,
  Invoice,
  ComplianceCase,
  CorporateTransaction,
  AuthorizedApp,
  RewardPoints,
  AccountsGroupList,
  TransactionDetailsResponse
} from '../types';
import { View } from '../types';
import { useFirebase } from './FirebaseContext';
import { db, auth, handleFirestoreError, OperationType, signInWithGoogle, logout as firebaseLogout } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where,
  deleteDoc,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { walletService } from '../services/WalletService';
import { BrowserProvider, formatEther } from 'ethers';

interface IDataContext {
  view: AppView;
  setView: (view: AppView) => void;
  userProfile: UserProfile;
  user: UserProfile; 
  creator: { name: string; title: string };
  transactions: Transaction[];
  assets: PortfolioAsset[];
  internalAccounts: InternalAccount[];
  notifications: Notification[];
  aiInsights: AIInsight[];
  insights: AIInsight[];
  budgets: BudgetCategory[];
  rewardItems: RewardItem[];
  apiStatus: APIStatus[];
  isSyncing: boolean;
  realAccounts: AccountsGroupList | null;
  
  setTransactions: (txs: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setAssets: (assets: PortfolioAsset[]) => void;
  setInternalAccounts: (accounts: InternalAccount[]) => void;
  showNotification: (message: string, severity: Notification['severity']) => void;
  markNotificationRead: (id: string) => void;
  redeemReward: (item: RewardItem) => boolean;
  
  simulationData: { time: string; value: number }[];
  isImportingData: boolean;
  treesPlanted: number;
  spendingForNextTree: number;

  isWalletConnectModalOpen: boolean;
  setWalletConnectModalOpen: (open: boolean) => void;
  connectWallet: () => Promise<void>;
  walletAddress: string | null;
  ethBalance: string;
  realTransactions: TransactionDetailsResponse | null;
  fetchRealAccountData: () => Promise<void>;
  fetchRealTransactionData: (accountId: string) => Promise<void>;

  // --- MISSING CONTEXT PROPERTIES ---
  financialGoals: FinancialGoal[];
  addFinancialGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  generateGoalPlan: (goalId: string) => Promise<void>;
  addContributionToGoal: (goalId: string, amount: number) => void;
  addRecurringContributionToGoal: (goalId: string, contribution: any) => void;
  updateRecurringContributionInGoal: (goalId: string, contributionId: string, updates: any) => void;
  deleteRecurringContributionFromGoal: (goalId: string, contributionId: string) => void;
  updateFinancialGoal: (goalId: string, updates: any) => void;
  linkGoals: (sourceId: string, targetId: string, type: any, amt?: number) => void;
  unlinkGoals: (sourceId: string, targetId: string) => void;
  
  creditScore: CreditScore;
  creditFactors: CreditFactor[];
  
  modernTreasuryApiKey: string;
  setModernTreasuryApiKey: (key: string) => void;
  modernTreasuryOrganizationId: string;
  setModernTreasuryOrganizationId: (id: string) => void;
  
  paymentOrders: PaymentOrder[];
  invoices: Invoice[];
  complianceCases: ComplianceCase[];
  corporateTransactions: CorporateTransaction[];
  
  linkedAccounts: any[];
  unlinkAccount: (id: string) => void;
  
  authorizedApps: AuthorizedApp[];
  authorizeApp: (app: any) => void;
  revokeApp: (id: string) => void;
  
  rewardPoints: RewardPoints;
  
  achSettings: any[];
  pipelines: any[];
  inboundBlobs: any[];
  fundFlows: any[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  isAuthenticated: boolean;
}

export const DataContext = createContext<IDataContext | undefined>(undefined);

const STORAGE_KEY = 'AQUARIUS_SOVEREIGN_STATE_V3';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser, loading: authLoading } = useFirebase();
  const [view, setView] = useState<AppView>(View.Dashboard);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [assets, setAssetsState] = useState<PortfolioAsset[]>([]);
  const [internalAccounts, setInternalAccountsState] = useState<InternalAccount[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [realAccounts, setRealAccounts] = useState<AccountsGroupList | null>(null);
  const [realTransactions, setRealTransactions] = useState<TransactionDetailsResponse | null>(null);

  const fetchRealAccountData = useCallback(async () => {
    try {
      const summary = await accountService.getAccountSummary();
      setRealAccounts(summary);
      showNotification("Account data synchronized", "info");
    } catch (err) {
      showNotification("Failed to sync account data", "error");
    }
  }, []);

  const fetchRealTransactionData = useCallback(async (accountId: string) => {
    try {
      const txs = await transactionService.getTransactionDetails(accountId);
      setRealTransactions(txs);
      showNotification("Transaction data synchronized", "info");
    } catch (err) {
      showNotification("Failed to sync transaction data", "error");
    }
  }, []);
  const [isWalletConnectModalOpen, setWalletConnectModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string>("0.00");
  
  const [mtApiKey, setMtApiKey] = useState("");
  const [mtOrgId, setMtOrgId] = useState("");

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: 'Guest User',
    title: 'Explorer',
    email: '',
    loyaltyTier: 'BRONZE',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
    usdBalance: 0, 
    fiatBalance: 0,
    cryptoBalance: 0,
    app_metadata: {
      subscription_status: 'none',
      is_pro: false,
    },
    user_metadata: {
      theme: 'sovereign_dark',
      discovery_source: 'Neural Referral'
    }
  });

  // Sync Profile and Data
  useEffect(() => {
    // Load local pro status if exists (for non-logged in users)
    const localPro = localStorage.getItem('AQUARIUS_PRO_STATUS');
    if (localPro === 'active') {
      setUserProfile(prev => ({
        ...prev,
        app_metadata: { ...prev.app_metadata, is_pro: true, subscription_status: 'active' }
      }));
    }

    if (!currentUser || authLoading) return;

    // Sync profile
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        const initialProfile: UserProfile = {
          id: currentUser.uid,
          name: currentUser.displayName || 'Sovereign User',
          title: 'New Architect',
          email: currentUser.email || '',
          loyaltyTier: 'BRONZE',
          avatarUrl: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
          usdBalance: 1000,
          fiatBalance: 1000,
          cryptoBalance: 0,
          app_metadata: { subscription_status: 'none', is_pro: false },
          user_metadata: { theme: 'sovereign_dark', discovery_source: 'Direct' }
        };
        setDoc(userRef, initialProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`));
        setUserProfile(initialProfile);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`));

    // Sync collections
    const txPath = `users/${currentUser.uid}/transactions`;
    const unsubTx = onSnapshot(collection(db, txPath), (snapshot) => {
      setTransactionsState(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, txPath));

    const assetPath = `users/${currentUser.uid}/portfolio`;
    const unsubAssets = onSnapshot(collection(db, assetPath), (snapshot) => {
      setAssetsState(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioAsset)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, assetPath));

    const accountPath = `users/${currentUser.uid}/accounts`;
    const unsubAccounts = onSnapshot(collection(db, accountPath), (snapshot) => {
      setInternalAccountsState(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternalAccount)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, accountPath));

    const goalPath = `users/${currentUser.uid}/goals`;
    const unsubGoals = onSnapshot(collection(db, goalPath), (snapshot) => {
      setFinancialGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialGoal)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, goalPath));

    const notifyPath = `users/${currentUser.uid}/notifications`;
    const unsubNotify = onSnapshot(collection(db, notifyPath), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, notifyPath));

    return () => {
      unsubProfile();
      unsubTx();
      unsubAssets();
      unsubAccounts();
      unsubGoals();
      unsubNotify();
    };
  }, [currentUser, authLoading]);

  const synchronizeState = useCallback(async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSyncing(false);
  }, []);

  const connectWallet = async () => {
    try {
      const { connector, session } = await walletService.connect();
      const address = session.namespaces.eip155.accounts[0].split(':')[2];
      setWalletAddress(address);
      const ethersProvider = new BrowserProvider(connector.provider);
      const balance = await ethersProvider.getBalance(address);
      setEthBalance(formatEther(balance));
      showNotification(`Sovereign Link Established`, "info");
    } catch (err) {
      showNotification("Sovereign link failed.", "error");
    }
  };

  const showNotification = useCallback(async (message: string, severity: Notification['severity']) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}/notifications`;
    try {
      await addDoc(collection(db, path), {
        message,
        timestamp: new Date().toISOString(),
        read: false,
        severity
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }, [currentUser]);

  const value: IDataContext = {
    view,
    setView,
    userProfile,
    user: userProfile,
    creator: { name: 'James Burvel oCallaghan III', title: 'Grand Architect' },
    transactions,
    assets,
    internalAccounts,
    notifications,
    aiInsights: [],
    insights: [],
    budgets: [],
    rewardItems: [],
    apiStatus: [],
    isSyncing,
    setTransactions: async (txs) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/transactions`;
      try {
        for (const tx of txs) {
          await addDoc(collection(db, path), tx);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    },
    updateTransaction: async (id, updates) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/transactions/${id}`;
      try {
        await updateDoc(doc(db, path), updates);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
    },
    deleteTransaction: async (id) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/transactions/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    },
    setAssets: async (assets) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/portfolio`;
      try {
        for (const asset of assets) {
          await addDoc(collection(db, path), asset);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    },
    setInternalAccounts: async (accounts) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/accounts`;
      try {
        for (const acc of accounts) {
          await addDoc(collection(db, path), acc);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    },
    showNotification,
    markNotificationRead: async (id) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/notifications/${id}`;
      try {
        await updateDoc(doc(db, path), { read: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
    },
    redeemReward: (item) => {
      showNotification(`Redeemed ${item.name}`, 'info');
      return true;
    },
    simulationData: Array.from({length: 30}, (_, i) => ({ time: `T-${30-i}`, value: 2450000000 + Math.random() * 50000000 })),
    isImportingData: false,
    treesPlanted: 142,
    spendingForNextTree: 120,
    isWalletConnectModalOpen,
    setWalletConnectModalOpen,
    connectWallet,
    walletAddress,
    ethBalance,
    realAccounts,
    realTransactions,
    fetchRealAccountData,
    fetchRealTransactionData,

    // --- FIREBASE IMPLEMENTATIONS FOR MISSING PROPERTIES ---
    financialGoals,
    addFinancialGoal: async (goal) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/goals`;
      try {
        await addDoc(collection(db, path), { ...goal, status: 'on_track' });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    },
    generateGoalPlan: async () => {},
    addContributionToGoal: async (goalId, amount) => {
      if (!currentUser) return;
      const goal = financialGoals.find(g => g.id === goalId);
      if (!goal) return;
      const path = `users/${currentUser.uid}/goals/${goalId}`;
      try {
        await updateDoc(doc(db, path), { currentAmount: goal.currentAmount + amount });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
    },
    addRecurringContributionToGoal: () => {},
    updateRecurringContributionInGoal: () => {},
    deleteRecurringContributionFromGoal: () => {},
    updateFinancialGoal: async (goalId, updates) => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/goals/${goalId}`;
      try {
        await updateDoc(doc(db, path), updates);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
    },
    linkGoals: () => {},
    unlinkGoals: () => {},
    
    creditScore: { score: 750, rating: 'Excellent', lastUpdated: new Date().toISOString() },
    creditFactors: [],
    
    modernTreasuryApiKey: mtApiKey,
    setModernTreasuryApiKey: setMtApiKey,
    modernTreasuryOrganizationId: mtOrgId,
    setModernTreasuryOrganizationId: setMtOrgId,
    
    paymentOrders: [],
    invoices: [],
    complianceCases: [],
    corporateTransactions: [],
    
    linkedAccounts: [],
    unlinkAccount: () => {},
    
    authorizedApps: [],
    authorizeApp: () => {},
    revokeApp: () => {},
    
    rewardPoints: { balance: 0, lastEarned: 0, lastRedeemed: 0, currency: 'USD', total: 0, pending: 0, history: [] },
    
    achSettings: [],
    pipelines: [],
    inboundBlobs: [],
    fundFlows: [],
    login: async () => {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error("Login failed", error);
      }
    },
    logout: async () => {
      try {
        await firebaseLogout();
      } catch (error) {
        console.error("Logout failed", error);
      }
    },
    isAuthReady: !authLoading,
    isAuthenticated: !!currentUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
