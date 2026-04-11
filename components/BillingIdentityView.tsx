
import React, { useEffect, useState } from 'react';
import { Shield, Lock, CreditCard, Zap, LogIn } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const BillingIdentityView: React.FC = () => {
  const { user } = useFirebase();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Handle success redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('stripe_success');
    const sessionId = params.get('session_id');

    if (success === 'true' && sessionId) {
      handlePaymentSuccess(sessionId);
    }
  }, []);

  const handlePaymentSuccess = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // Verify session on server
      const response = await fetch(`/api/v1/stripe/session/${sessionId}`);
      const session = await response.json();

      if (session.payment_status === 'paid') {
        localStorage.setItem('AQUARIUS_PRO_STATUS', 'active');
        setIsConfirmed(true);
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            'app_metadata.is_pro': true,
            'app_metadata.subscription_status': 'active'
          });
        }
        // Wait a bit then reload to enter OS
        setTimeout(() => {
          window.location.href = window.location.pathname;
        }, 3000);
      }
    } catch (error: any) {
      console.error("Verification failed", error);
      alert("Payment verification failed. Please contact support if your payment was successful.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectLedger = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Redirect the current window (the iframe) to Stripe
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Stripe Error:", error);
      alert(error.message || "Failed to initiate ledger link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateSuccess = async () => {
    setIsSimulating(true);
    try {
      // Set local storage for persistence without Google
      localStorage.setItem('AQUARIUS_PRO_STATUS', 'active');
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'app_metadata.is_pro': true,
          'app_metadata.subscription_status': 'active'
        });
      } else {
        // Just trigger a page reload or state update if no user
        window.location.reload();
      }
    } catch (error) {
      if (user) handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 flex flex-col items-center justify-center min-h-[60vh] p-6">
      <header className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="text-indigo-400 w-8 h-8" />
          <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-[0.4em]">Identity Vault Paywall</h2>
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter mb-4">Sovereign <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">Access</span></h1>
        <p className="text-gray-400 max-w-xl font-light leading-relaxed mx-auto">
          To unlock the full neural capacity of Aquarius OS, establish a recurring capital link via the Stripe Global Ledger.
        </p>
      </header>

      <div className="p-10 bg-slate-900/50 border border-indigo-500/20 rounded-[3rem] shadow-2xl shadow-indigo-500/10 relative overflow-hidden group max-w-md w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center gap-8">
          {isConfirmed ? (
            <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                <Zap className="text-green-400 w-10 h-10 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-white mb-2">LINK ESTABLISHED</h3>
                <p className="text-green-400/70 font-mono text-xs uppercase tracking-widest">Synchronizing Neural Interface...</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-8">
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 w-full text-center">
                <p className="text-xs font-mono text-indigo-300 uppercase tracking-widest">Neural Access Terminal</p>
              </div>

              {(!import.meta.env.VITE_STRIPE_PRICE_ID || import.meta.env.VITE_STRIPE_PRICE_ID === 'price_1THK3746imZegW0PSuh0Ptbt') && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-400 font-mono uppercase tracking-wider text-center">
                  Warning: Stripe Price ID not configured. Please set VITE_STRIPE_PRICE_ID in settings.
                </div>
              )}

              {/* Stripe Connect Button */}
              <div className="w-full flex flex-col items-center gap-6">
                <button 
                  onClick={handleConnectLedger}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard size={24} />
                  {isLoading ? 'ESTABLISHING LINK...' : 'CONNECT GLOBAL LEDGER'}
                </button>

                <button 
                  onClick={handleSimulateSuccess}
                  disabled={isSimulating}
                  className="text-[10px] text-indigo-400/30 hover:text-indigo-400 font-mono uppercase tracking-widest flex items-center gap-2 transition-colors mt-4"
                >
                  <Zap size={10} /> {isSimulating ? 'Synchronizing...' : 'Bypass_Paywall_Simulation'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          <Lock size={12} /> Secure_Stripe_Handshake_Active
        </div>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-8 max-w-3xl w-full">
        <div className="text-center space-y-2">
          <div className="text-indigo-400 font-bold">74+</div>
          <div className="text-[10px] text-slate-500 uppercase font-black">Logic Enclaves</div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-indigo-400 font-bold">UNLIMITED</div>
          <div className="text-[10px] text-slate-500 uppercase font-black">Neural Ingest</div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-indigo-400 font-bold">PRIORITY</div>
          <div className="text-[10px] text-slate-500 uppercase font-black">Gemini Compute</div>
        </div>
      </div>
    </div>
  );
};

export default BillingIdentityView;
