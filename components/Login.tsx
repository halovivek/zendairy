
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulating login
    onLogin({
      name: email.split('@')[0],
      email: email,
      profilePic: `https://picsum.photos/seed/${email}/200`,
      isSynced: true
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-primary flex size-14 shrink-0 items-center justify-center bg-primary/10 rounded-full">
        <span className="material-symbols-outlined text-[32px]">auto_stories</span>
      </div>
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
        <p className="text-gray-500 dark:text-gray-400">Your private sanctuary is waiting.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">Email address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold">Password</label>
            <button type="button" className="text-xs font-semibold text-primary">Forgot password?</button>
          </div>
          <div className="relative">
            <input 
              type="password" 
              className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <span className="material-symbols-outlined text-xl">visibility</span>
            </button>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
        >
          Login to Diary
        </button>
      </form>

      <div className="w-full my-8 flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-gray-200 dark:bg-primary/10"></div>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Or continue with</span>
        <div className="h-[1px] flex-1 bg-gray-200 dark:bg-primary/10"></div>
      </div>

      <button className="w-full h-12 flex items-center justify-center gap-3 border border-gray-200 dark:border-primary/20 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-primary/5 transition-all">
        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
        Google Account
      </button>

      <p className="mt-10 text-sm text-gray-500">
        New to ZenDiary? <button className="text-primary font-bold">Create an account</button>
      </p>

      <div className="absolute bottom-6 flex items-center gap-2 opacity-50">
        <span className="material-symbols-outlined text-sm">lock</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">End-to-end encrypted & secure</span>
      </div>
    </div>
  );
};

export default Login;
