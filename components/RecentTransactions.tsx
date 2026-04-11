
import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { Edit2, Trash2, Check, X } from 'lucide-react';

const RecentTransactions: React.FC = () => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { transactions, updateTransaction, deleteTransaction } = context;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const handleSave = (id: string) => {
    updateTransaction(id, { amount: editValue });
    setEditingId(null);
  };

  return (
    <Card title="Real-Time Ledger" subtitle="Mutable transaction stream">
      <div className="space-y-4 mt-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {transactions.length === 0 && (
          <p className="text-gray-600 italic text-center py-10">Ledger is currently empty. Visit Data Ingest.</p>
        )}
        {transactions.map(tx => (
          <div key={tx.id} className="group p-4 bg-gray-900 border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all flex justify-between items-center">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'INFLOW' ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="text-sm font-bold text-white truncate">{tx.description}</p>
              </div>
              <p className="text-[10px] text-gray-500 font-mono mt-1">{tx.date} // {tx.category}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {editingId === tx.id ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={editValue} 
                    onChange={e => setEditValue(Number(e.target.value))}
                    className="w-24 bg-black border border-cyan-500 rounded p-1 text-xs text-white"
                  />
                  <button onClick={() => handleSave(tx.id)} className="text-green-400"><Check size={14}/></button>
                  <button onClick={() => setEditingId(null)} className="text-red-400"><X size={14}/></button>
                </div>
              ) : (
                <p className={`font-mono font-bold ${tx.type === 'INFLOW' ? 'text-green-400' : 'text-white'}`}>
                  {tx.type === 'INFLOW' ? '+' : '-'}${tx.amount.toLocaleString()}
                </p>
              )}
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingId(tx.id); setEditValue(tx.amount); }}
                  className="p-1.5 text-gray-500 hover:text-cyan-400"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => deleteTransaction(tx.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentTransactions;
