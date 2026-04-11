import React, { useState, useEffect, useContext } from 'react';
import { Activity, FileText, ArrowRightLeft, TrendingUp, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { DataContext } from '../context/DataContext';

interface TransactionViewerProps {
  accountId?: string;
}

export const TransactionViewer: React.FC<TransactionViewerProps> = ({ accountId }) => {
  const context = useContext(DataContext);
  const { realTransactions, fetchRealTransactionData } = context || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'investment'>('standard');

  const transactions = realTransactions?.transactions || [];
  const investmentTransactions = realTransactions?.investmentTransaction || [];

  const loadData = async () => {
    if (!accountId || !fetchRealTransactionData) return;
    setLoading(true);
    setError(null);
    try {
      await fetchRealTransactionData(accountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      loadData();
    }
  }, [accountId]);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md text-white w-full max-w-6xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lime-500/20 rounded-lg text-lime-400">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono tracking-tight">Transaction Ledger</h2>
            <p className="text-xs text-gray-400 font-mono">Account: {accountId}</p>
          </div>
        </div>
        
        <button 
          onClick={loadData}
          className="p-2 hover:bg-white/5 rounded-md transition-colors text-gray-400 hover:text-white"
          title="Refresh Data"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('standard')}
          className={`px-4 py-2 font-mono text-sm font-medium transition-all border-b-2 ${
            activeTab === 'standard' 
              ? 'border-lime-400 text-lime-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Standard Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('investment')}
          className={`px-4 py-2 font-mono text-sm font-medium transition-all border-b-2 ${
            activeTab === 'investment' 
              ? 'border-lime-400 text-lime-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Investments ({investmentTransactions.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <RefreshCw size={32} className="animate-spin mb-4 text-lime-400" />
          <p className="font-mono text-sm">Synchronizing ledger data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 font-mono text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'standard' && transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500 font-mono">No standard transactions found.</div>
          )}
          
          {activeTab === 'investment' && investmentTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500 font-mono">No investment transactions found.</div>
          )}

          {activeTab === 'standard' && transactions.map((txn, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-lime-500/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${txn.transactionType === 'DEBIT' ? 'bg-red-500/20 text-red-400' : 'bg-lime-500/20 text-lime-400'}`}>
                    {txn.transactionType === 'DEBIT' ? <ArrowRightLeft size={16} /> : <DollarSign size={16} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{txn.transactionDescription}</h4>
                    <p className="text-xs text-gray-400 font-mono">{txn.merchantName || 'Unknown Merchant'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold ${txn.transactionType === 'DEBIT' ? 'text-red-400' : 'text-lime-400'}`}>
                    {txn.transactionType === 'DEBIT' ? '-' : '+'}{txn.currencyCode} {txn.transactionAmount?.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">Status: {txn.transactionStatus}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5 text-xs font-mono text-gray-400">
                <div>
                  <span className="block text-gray-500 mb-1">Date</span>
                  <span className="text-white flex items-center gap-1"><Calendar size={12}/> {txn.transactionDate}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Account</span>
                  <span className="text-white">{txn.displayAccountNumber}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Ref ID</span>
                  <span className="text-white truncate block" title={txn.transactionReferenceId}>{txn.transactionReferenceId}</span>
                </div>
                {txn.transactionDocumentList && txn.transactionDocumentList.length > 0 && (
                  <div>
                    <span className="block text-gray-500 mb-1">Documents</span>
                    <span className="text-lime-400 flex items-center gap-1 cursor-pointer hover:underline">
                      <FileText size={12} /> {txn.transactionDocumentList[0].transactionDocument}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {activeTab === 'investment' && investmentTransactions.map((txn, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-blue-500/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${txn.orderType === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{txn.name} ({txn.code})</h4>
                    <p className="text-xs text-gray-400 font-mono">{txn.securityType} • {txn.stockMarketCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white">
                    {txn.currencyCode} {txn.transactionAmount?.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">Status: {txn.orderStatus}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5 text-xs font-mono text-gray-400">
                <div>
                  <span className="block text-gray-500 mb-1">Order Date</span>
                  <span className="text-white flex items-center gap-1"><Calendar size={12}/> {txn.orderDate}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Quantity</span>
                  <span className="text-white">{txn.orderQuantity} @ {txn.price}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Order Type</span>
                  <span className={`font-bold ${txn.orderType === 'BUY' ? 'text-blue-400' : 'text-purple-400'}`}>{txn.orderType}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">ISIN</span>
                  <span className="text-white">{txn.isinCode}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
