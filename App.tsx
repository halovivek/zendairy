
import React, { useState, useEffect } from 'react';
import { AppView, DiaryEntry, User, Reminder } from './types.ts';
import Login from './components/Login.tsx';
import Home from './components/Home.tsx';
import Editor from './components/Editor.tsx';
import Stats from './components/Stats.tsx';
import Calendar from './components/Calendar.tsx';
import Settings from './components/Settings.tsx';
import BottomNav from './components/BottomNav.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('login');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const savedEntries = localStorage.getItem('zendiary_data');
    const savedUser = localStorage.getItem('zendiary_user');
    const savedReminders = localStorage.getItem('zendiary_reminders');
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
    if (savedUser) { setUser(JSON.parse(savedUser)); setView('home'); }

    // Reminder Check Interval
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const activeReminder = reminders.find(r => r.active && r.time === currentTime);
      if (activeReminder) {
        // Trigger visual "System Notification"
        setNotification(`Time for your daily memory: ${activeReminder.title}`);
        // Simulate a haptic nudge/sound if we were native
        if ('vibrate' in navigator) navigator.vibrate(200);
        setTimeout(() => setNotification(null), 8000);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [reminders]);

  useEffect(() => localStorage.setItem('zendiary_data', JSON.stringify(entries)), [entries]);
  useEffect(() => localStorage.setItem('zendiary_reminders', JSON.stringify(reminders)), [reminders]);

  const saveEntry = (entry: DiaryEntry) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      return idx > -1 ? prev.map(e => e.id === entry.id ? entry : e) : [entry, ...prev];
    });
    setView('home');
  };

  const renderView = () => {
    if (view === 'login') return <Login onLogin={u => { setUser(u); localStorage.setItem('zendiary_user', JSON.stringify(u)); setView('home'); }} />;
    if (!user) return <Login onLogin={() => {}} />;

    switch (view) {
      case 'home': return <Home user={user} entries={entries} onEdit={id => { setEditingEntryId(id); setView('editor'); }} onToggleFavorite={id => setEntries(p => p.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e))} />;
      case 'editor': return <Editor entry={entries.find(e => e.id === editingEntryId)} onSave={saveEntry} onBack={() => setView('home')} onDelete={id => setEntries(p => p.filter(e => e.id !== id))} />;
      case 'stats': return <Stats entries={entries} />;
      case 'calendar': return <Calendar entries={entries} onDateSelect={d => { const e = entries.find(x => x.date.split('T')[0] === d); setEditingEntryId(e?.id || null); setView('editor'); }} />;
      case 'settings': return <Settings user={user} reminders={reminders} onLogout={() => { setUser(null); localStorage.removeItem('zendiary_user'); setView('login'); }} onUpdateUser={setUser} onAddReminder={r => setReminders([...reminders, r])} onUpdateReminder={r => setReminders(p => p.map(x => x.id === r.id ? r : x))} onDeleteReminder={id => setReminders(p => p.filter(x => x.id !== id))} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white dark:bg-[#191121] shadow-2xl relative overflow-hidden font-sans">
      {notification && (
        <div 
          onClick={() => setNotification(null)}
          className="absolute top-4 left-4 right-4 z-[200] bg-[#8c36e2] text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 cursor-pointer animate-in fade-in slide-in-from-top-10 transition-all active:scale-95"
        >
          <div className="size-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined filled text-white">notifications_active</span>
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5">ZenDiary Nudge</h4>
            <p className="text-xs font-bold leading-tight">{notification}</p>
          </div>
          <span className="material-symbols-outlined text-sm opacity-40">close</span>
        </div>
      )}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-safe">
        {renderView()}
      </main>
      {view !== 'login' && view !== 'editor' && (
        <BottomNav 
          currentView={view} 
          onViewChange={setView} 
          onAddClick={() => { setEditingEntryId(null); setView('editor'); }} 
        />
      )}
    </div>
  );
};

export default App;
