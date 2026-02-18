
import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Check if user previously enabled biometrics
    const savedUser = localStorage.getItem('zendiary_user');
    if (savedUser) {
      const user = JSON.parse(savedUser) as User;
      if (user.biometricEnabled) {
        setBiometricAvailable(true);
        // Automatically trigger if appropriate, or wait for click
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
    
    // Simulate native biometric prompt delay
    setTimeout(() => {
      const savedUserStr = localStorage.getItem('zendiary_user');
      if (savedUserStr) {
        const user = JSON.parse(savedUserStr);
        onLogin(user);
      } else {
        alert("Please login with email first to enable Biometrics.");
      }
      setIsAuthenticating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-[-10%] right-[-10%] size-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-5%] left-[-5%] size-48 bg-primary/10 rounded-full blur-3xl -z-10"></div>

      {isAuthenticating && (
        <div className="fixed inset-0 z-[300] bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 relative">
             <span className="material-symbols-outlined text-6xl text-primary animate-pulse">face</span>
             <div className="absolute inset-0 border-2 border-primary rounded-3xl animate-ping opacity-20"></div>
          </div>
          <p className="text-primary font-bold animate-pulse">Scanning Biometrics...</p>
        </div>
      )}

      <div className="mb-8 text-primary flex size-16 shrink-0 items-center justify-center bg-primary/10 rounded-[24px] shadow-xl shadow-primary/5">
        <span className="material-symbols-outlined text-[36px]">auto_stories</span>
      </div>
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
        <p className="text-gray-500 dark:text-gray-400">Your private sanctuary is waiting.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Email address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 px-5 rounded-2xl border border-gray-100 dark:border-primary/10 bg-white dark:bg-primary/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary">Forgot?</button>
          </div>
          <div className="relative">
            <input 
              type="password" 
              className="w-full h-14 px-5 rounded-2xl border border-gray-100 dark:border-primary/10 bg-white dark:bg-primary/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
              placeholder="••••••••"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
              <span className="material-symbols-outlined text-xl">visibility</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            type="submit"
            className="flex-1 h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-[0.97] flex items-center justify-center gap-2"
          >
            Sign In
          </button>
          
          {biometricAvailable && (
            <button 
              type="button"
              onClick={handleBiometricAuth}
              className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-md"
              title="Biometric Login"
            >
              <span className="material-symbols-outlined text-3xl">faceid</span>
            </button>
          )}
        </div>
      </form>

      <div className="w-full my-8 flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-primary/10"></div>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Secure Access</span>
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-primary/10"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <button className="h-14 flex items-center justify-center gap-3 border border-gray-100 dark:border-primary/10 rounded-2xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-primary/5 transition-all">
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
          Google
        </button>
        <button 
          onClick={handleBiometricAuth}
          className="h-14 flex items-center justify-center gap-3 border border-gray-100 dark:border-primary/10 rounded-2xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-primary/5 transition-all"
        >
          <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
          Biometric
        </button>
      </div>

      <p className="mt-10 text-sm text-gray-400">
        New to ZenDiary? <button className="text-primary font-bold">Join now</button>
      </p>

      <div className="mt-12 flex items-center gap-2 opacity-30">
        <span className="material-symbols-outlined text-sm">lock</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">E2E Encrypted</span>
      </div>
    </div>
  );
};

export default Login;
