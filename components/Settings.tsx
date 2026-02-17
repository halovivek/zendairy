
import React, { useState } from 'react';
import { User, Reminder } from '../types';
import { simulateDriveSync, SyncStatus } from '../services/driveService';

interface SettingsProps {
  user: User;
  reminders: Reminder[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onAddReminder: (reminder: Reminder) => void;
  onUpdateReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  user, reminders, onLogout, onUpdateUser, onAddReminder, onUpdateReminder, onDeleteReminder 
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    progress: 0,
    lastSync: localStorage.getItem('zendiary_last_sync'),
    status: 'Cloud Ready'
  });

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('20:00');
  const [newReminderTitle, setNewReminderTitle] = useState('Time to write');

  const handleSync = async () => {
    await simulateDriveSync(setSyncStatus);
  };

  const handleAddReminder = () => {
    if (!newReminderTime || !newReminderTitle) return;
    onAddReminder({
      id: Date.now().toString(),
      title: newReminderTitle,
      time: newReminderTime,
      days: [0,1,2,3,4,5,6],
      active: true
    });
    setShowAddReminder(false);
  };

  return (
    <div className="px-6 py-8 pb-32 select-none">
      <h2 className="text-2xl font-bold mb-8">Account Settings</h2>

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-10 p-5 bg-primary/5 dark:bg-primary/10 rounded-[32px] border border-primary/10">
        <img src={user.profilePic} className="size-16 rounded-full border-2 border-primary/20 object-cover" alt="Avatar" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{user.name}</h3>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <button className="text-primary"><span className="material-symbols-outlined">edit</span></button>
      </div>

      {/* Cloud Backup Section */}
      <div className="space-y-4 mb-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Secure Cloud</h4>
        <div className="bg-primary/5 dark:bg-primary/10 rounded-[32px] overflow-hidden border border-primary/10 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ${syncStatus.isSyncing ? 'animate-spin' : ''}`}>
              <span className="material-symbols-outlined text-2xl">cloud_sync</span>
            </div>
            <div>
              <p className="text-sm font-black">Google Drive Backup</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {syncStatus.isSyncing ? syncStatus.status : `Last updated: ${syncStatus.lastSync || 'Never'}`}
              </p>
            </div>
          </div>
          
          {syncStatus.isSyncing && (
            <div className="w-full bg-primary/10 h-2 rounded-full mb-6 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-700 ease-out" 
                style={{ width: `${syncStatus.progress}%` }}
              />
            </div>
          )}

          <button 
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            {syncStatus.isSyncing ? 'Synchronizing...' : 'Sync Memories Now'}
          </button>
        </div>
      </div>

      {/* Reminders Section */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Daily Reminders</h4>
          <button onClick={() => setShowAddReminder(!showAddReminder)} className="text-primary text-xs font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">add</span> Add New
          </button>
        </div>

        {showAddReminder && (
          <div className="bg-white dark:bg-white/5 border border-primary/20 p-5 rounded-3xl animate-in slide-in-from-top-2 mb-4">
            <div className="space-y-4">
              <input 
                type="text" value={newReminderTitle} onChange={e => setNewReminderTitle(e.target.value)}
                placeholder="Reminder Title" className="w-full bg-primary/5 border-none rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-primary/20"
              />
              <input 
                type="time" value={newReminderTime} onChange={e => setNewReminderTime(e.target.value)}
                className="w-full bg-primary/5 border-none rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleAddReminder} className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold">Set Reminder</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reminders.length === 0 && <p className="text-center py-4 text-xs text-gray-400 italic">No reminders set</p>}
          {reminders.map(r => (
            <div key={r.id} className="bg-primary/5 dark:bg-primary/10 p-5 rounded-[32px] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`size-10 rounded-xl flex items-center justify-center ${r.active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-xl">alarm</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{r.title}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{r.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onUpdateReminder({ ...r, active: !r.active })} className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${r.active ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`size-4 bg-white rounded-full transition-transform shadow-md ${r.active ? 'translate-x-6' : ''}`} />
                </button>
                <button onClick={() => onDeleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><span className="material-symbols-outlined text-lg">delete</span></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onLogout} className="w-full p-5 bg-red-500/10 text-red-500 rounded-[32px] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 active:bg-red-500/20 transition-colors">
        <span className="material-symbols-outlined">logout</span> Log Out of Session
      </button>
    </div>
  );
};

export default Settings;
