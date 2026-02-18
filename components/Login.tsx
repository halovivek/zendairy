
import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [returningUser, setReturningUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user previously enabled biometrics
    const savedUser = localStorage.getItem('zendiary_user');
    if (savedUser) {
      const user = JSON.parse(savedUser) as User;
      if (user.biometricEnabled) {
        setBiometricAvailable(true);
        setReturningUser(user);
        // We don't auto-trigger to avoid interrupting the user if they want to switch accounts
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    performLogin(email);
  };

  const performLogin = (userEmail: string) => {
    const name = userEmail.split('@')[0];
    const savedUserStr = localStorage.getItem('zendiary_user');
    const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

    onLogin({
      name: name,
      email: userEmail,
      profilePic: `https://picsum.photos/seed/${userEmail}/200`,
      isSynced: true,
      biometricEnabled: savedUser?.biometricEnabled || false
    });
  };

  const handleBiometricAuth = () => {
    setIsAuthenticating(true);
    
    // Simulate native biometric prompt delay (Face ID / Fingerprint)
    setTimeout(() => {
      const savedUserStr = localStorage.getItem('zendiary_user');
      if (savedUserStr) {
        const user = JSON.parse(savedUserStr);
        onLogin(user);
      } else {
        alert("No biometric profile found. Please login with email first to enable secure access.");
        setIsAuthenticating(false);
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 relative overflow-hidden bg-white dark:bg-[#191121]">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-15%] right-[-15%] size-80 bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] size-64 bg-primary/20 rounded-full blur-[80px] -z-10"></div>

      {/* Biometric Scanning Overlay */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-[500] bg-white/40 dark:bg-[#191121]/40 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative flex flex-col items-center">
            <div className="size-32 rounded-[40px] bg-primary/10 flex items-center justify-center mb-8 relative shadow-2xl shadow-primary/20">
               <span className="material-symbols-outlined text-7xl text-primary animate-pulse filled">faceid</span>
               {/* Scanning Line Animation */}
               <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 blur-[2px] animate-[scan_2s_infinite_ease-in-out]"></div>
               <div className="absolute inset-[-4px] border-2 border-primary/20 rounded-[44px] animate-ping opacity-10"></div>
            </div>
            <h3 className="text-xl font-black text-primary tracking-tight mb-2">Verifying Identity</h3>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500">Scanning Biometrics...</p>
          </div>
          
          <style>{`
            @keyframes scan {
              0% { top: 10%; opacity: 0; }
              50% { top: 90%; opacity: 1; }
              100% { top: 10%; opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* App Branding */}
      <div className="flex flex-col items-center mb-12">
        <div className="mb-6 text-white flex size-20 items-center justify-center bg-primary rounded-[28px] shadow-2xl shadow-primary/40 rotate-3 transition-transform hover:rotate-0">
          <span className="material-symbols-outlined text-[44px] filled">auto_stories</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2">ZenDiary</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-center max-w-[240px]">
          Your thoughts, secured in a private sanctuary.
        </p>
      </div>

      {/* Biometric Priority Option */}
      {biometricAvailable && (
        <div className="w-full mb-8 animate-in slide-in-from-bottom-6">
          <button 
            onClick={handleBiometricAuth}
            className="w-full group h-20 bg-primary/10 hover:bg-primary/20 border-2 border-primary/20 rounded-3xl flex items-center px-6 gap-5 transition-all active:scale-95"
          >
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-3xl filled">faceid</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-primary uppercase tracking-widest leading-none mb-1">Fast Access</p>
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-none">Login as {returningUser?.name}</p>
            </div>
            <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">chevron_right</span>
          </button>
          
          <div className="flex items-center gap-4 my-8">
            <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5"></div>
            <span className="text-[10px] uppercase font-black text-gray-300 dark:text-gray-700 tracking-[0.3em]">OR USE EMAIL</span>
            <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5"></div>
          </div>
        </div>
      )}

      {/* Standard Login Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Account Email</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xl">alternate_email</span>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-16 pl-12 pr-6 rounded-3xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white dark:focus:bg-[#1f1629] outline-none transition-all font-bold text-sm"
              placeholder="e.g. alex@story.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Vault Key</label>
            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Recovery</button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xl">lock</span>
            <input 
              type="password" 
              className="w-full h-16 pl-12 pr-12 rounded-3xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white dark:focus:bg-[#1f1629] outline-none transition-all font-bold text-sm"
              placeholder="••••••••"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">visibility</span>
            </button>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full h-16 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-3"
        >
          Enter Sanctuary
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </form>

      {/* Footer Branding */}
      {!biometricAvailable && (
        <div className="mt-12 w-full">
           <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5"></div>
            <span className="text-[10px] uppercase font-black text-gray-300 dark:text-gray-700 tracking-[0.3em]">SECURE METHODS</span>
            <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="h-14 flex items-center justify-center gap-3 border border-gray-100 dark:border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5 grayscale" alt="Google" />
              Google
            </button>
            <button 
              onClick={handleBiometricAuth}
              className="h-14 flex items-center justify-center gap-3 border border-gray-100 dark:border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
              Biometrics
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto pt-10 flex items-center gap-2 opacity-30 select-none">
        <span className="material-symbols-outlined text-sm">verified_user</span>
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hardware Encrypted</span>
      </div>
    </div>
  );
};

export default Login;
