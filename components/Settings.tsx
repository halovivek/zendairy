
import React, { useState } from 'react';
import { User, Reminder } from '../types.ts';
import { simulateDriveSync, SyncStatus } from '../services/driveService.ts';

interface SettingsProps {
  user: User;
  reminders: Reminder[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onAddReminder: (reminder: Reminder) => void;
  onUpdateReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const Settings: React.FC<SettingsProps> = ({ 
  user, reminders, onLogout, onUpdateUser, onAddReminder, onUpdateReminder, onDeleteReminder 
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    progress: 0,
    lastSync: localStorage.getItem('zendiary_last_sync'),
    status: 'Cloud Ready'
  });

  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [showAddReminder, setShowAddReminder] = useState(false);
  
  // Form State
  const [reminderTime, setReminderTime] = useState('20:00');
  const [reminderTitle, setReminderTitle] = useState('Time to write');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const handleSync = async () => {
    const simulateConflict = Math.random() < 0.33;
    await simulateDriveSync(setSyncStatus, simulateConflict);
  };

  const resolveConflict = async (resolution: 'local' | 'cloud') => {
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: true,
      hasConflict: false,
      status: `Applying ${resolution} version...`
    }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    await simulateDriveSync(setSyncStatus, false);
  };

  const resetForm = () => {
    setReminderTime('20:00');
    setReminderTitle('Time to write');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setShowAddReminder(false);
    setEditingReminderId(null);
  };

  const handleSaveReminder = () => {
    if (!reminderTime || !reminderTitle) return;
    
    const reminderData: Reminder = {
      id: editingReminderId || Date.now().toString(),
      title: reminderTitle,
      time: reminderTime,
      days: selectedDays,
      active: true
    };

    if (editingReminderId) {
      onUpdateReminder(reminderData);
    } else {
      onAddReminder(reminderData);
    }
    resetForm();
  };

  const startEdit = (reminder: Reminder) => {
    setEditingReminderId(reminder.id);
    setReminderTitle(reminder.title);
    setReminderTime(reminder.time);
    setSelectedDays(reminder.days);
    setShowAddReminder(true);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex].sort()
    );
  };

  const toggleBiometrics = () => {
    const updatedUser = { ...user, biometricEnabled: !user.biometricEnabled };
    onUpdateUser(updatedUser);
    localStorage.setItem('zendiary_user', JSON.stringify(updatedUser));
  };

  return (
    <div className="px-6 py-8 pb-32 select-none animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold mb-8">Account Settings</h2>

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-10 p-5 bg-primary/5 dark:bg-primary/10 rounded-[32px] border border-primary/10 transition-all">
        <img src={user.profilePic} className="size-16 rounded-full border-2 border-primary/20 object-cover" alt="Avatar" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{user.name}</h3>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <button className="text-primary size-10 bg-white dark:bg-white/5 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
          <span className="material-symbols-outlined">edit</span>
        </button>
      </div>

      {/* Security Section */}
      <div className="space-y-4 mb-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Security & Privacy</h4>
        <div className="bg-primary/5 dark:bg-primary/10 rounded-[32px] p-6 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">faceid</span>
              </div>
              <div>
                <p className="text-sm font-black">Biometric Lock</p>
                <p className="text-[10px] text-gray-400 font-bold">FaceID or Fingerprint</p>
              </div>
            </div>
            <button 
              onClick={toggleBiometrics}
              className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${user.biometricEnabled ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300 dark:bg-white/10'}`}
            >
              <div className={`size-4 bg-white rounded-full transition-transform ${user.biometricEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Backup Section */}
      <div className="space-y-4 mb-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Secure Cloud</h4>
        <div className={`bg-primary/5 dark:bg-primary/10 rounded-[32px] overflow-hidden border transition-all duration-500 p-6 ${syncStatus.hasConflict ? 'border-red-500/50 bg-red-500/5' : 'border-primary/10'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`size-12 rounded-2xl flex items-center justify-center text-primary ${syncStatus.isSyncing ? 'animate-spin' : ''} ${syncStatus.hasConflict ? 'bg-red-500/10 text-red-500' : 'bg-primary/10'}`}>
              <span className="material-symbols-outlined text-2xl">
                {syncStatus.hasConflict ? 'warning' : 'cloud_sync'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black">Google Drive Backup</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${syncStatus.hasConflict ? 'text-red-500' : 'text-gray-400'}`}>
                {syncStatus.status}
              </p>
            </div>
          </div>
          
          {(syncStatus.isSyncing || syncStatus.progress > 0) && !syncStatus.hasConflict && (
            <div className="w-full bg-primary/10 h-2 rounded-full mb-6 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(140,54,226,0.5)]" 
                style={{ width: `${syncStatus.progress}%` }}
              />
            </div>
          )}

          {syncStatus.hasConflict && syncStatus.conflictDetails && (
            <div className="mb-6 p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-red-500/20 animate-in fade-in slide-in-from-top-4">
              <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Conflict in: {syncStatus.conflictDetails.fileName}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                  onClick={() => resolveConflict('local')}
                  className="p-3 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 text-left hover:border-primary transition-all active:scale-95"
                >
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Local Version</p>
                  <p className="text-[10px] font-bold leading-tight line-clamp-1">{syncStatus.conflictDetails.localDate}</p>
                  <div className="mt-2 text-[9px] font-black text-primary flex items-center gap-1 uppercase tracking-widest">
                    KEEP LOCAL <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </div>
                </button>
                <button 
                  onClick={() => resolveConflict('cloud')}
                  className="p-3 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 text-left hover:border-primary transition-all active:scale-95"
                >
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Cloud Version</p>
                  <p className="text-[10px] font-bold leading-tight line-clamp-1">{syncStatus.conflictDetails.cloudDate}</p>
                  <div className="mt-2 text-[9px] font-black text-primary flex items-center gap-1 uppercase tracking-widest">
                    KEEP CLOUD <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={handleSync}
            disabled={syncStatus.isSyncing || syncStatus.hasConflict}
            className={`w-full py-4 text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-primary/20 ${syncStatus.hasConflict ? 'bg-gray-400' : 'bg-primary'}`}
          >
            {syncStatus.isSyncing ? 'Synchronizing...' : syncStatus.hasConflict ? 'Action Required' : 'Sync Memories Now'}
          </button>
        </div>
      </div>

      {/* Reminders Section */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Memory Nudges</h4>
          <button 
            onClick={() => setShowAddReminder(!showAddReminder)} 
            className="text-primary text-xs font-bold flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">{showAddReminder ? 'close' : 'add'}</span> 
            {showAddReminder ? 'Cancel' : 'Add New'}
          </button>
        </div>

        {showAddReminder && (
          <div className="bg-white dark:bg-white/5 border border-primary/20 p-6 rounded-[32px] animate-in slide-in-from-top-4 mb-4 shadow-xl shadow-primary/5">
            <h5 className="text-xs font-black uppercase tracking-widest text-primary mb-6">{editingReminderId ? 'Edit Nudge' : 'New Nudge'}</h5>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Nudge Title</label>
                <input 
                  type="text" value={reminderTitle} onChange={e => setReminderTitle(e.target.value)}
                  placeholder="e.g. Daily Reflection" className="w-full bg-primary/5 dark:bg-primary/10 border-none rounded-2xl text-sm font-bold p-4 focus:ring-2 focus:ring-primary/20 placeholder:text-gray-300"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Scheduled Time</label>
                  <input 
                    type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                    className="w-full bg-primary/5 dark:bg-primary/10 border-none rounded-2xl text-sm font-bold p-4 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Repeat Days</label>
                   <div className="flex justify-between items-center h-[52px]">
                     {DAYS_OF_WEEK.map((day, idx) => (
                       <button
                         key={idx}
                         onClick={() => toggleDay(idx)}
                         className={`size-7 rounded-full text-[9px] font-black transition-all ${selectedDays.includes(idx) ? 'bg-primary text-white' : 'bg-primary/5 dark:bg-white/5 text-gray-400'}`}
                       >
                         {day}
                       </button>
                     ))}
                   </div>
                </div>
              </div>

              <button onClick={handleSaveReminder} className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
                {editingReminderId ? 'Update Nudge' : 'Create Nudge'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reminders.length === 0 && !showAddReminder && (
            <div className="text-center py-10 bg-primary/5 rounded-[32px] border border-dashed border-primary/20">
              <span className="material-symbols-outlined text-4xl text-primary/20 mb-2">notifications_off</span>
              <p className="text-xs text-gray-400 italic">No nudges scheduled.</p>
            </div>
          )}
          {reminders.map(r => (
            <div 
              key={r.id} 
              className={`bg-primary/5 dark:bg-primary/10 p-5 rounded-[32px] flex items-center justify-between group border transition-all ${editingReminderId === r.id ? 'border-primary' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-4 flex-1" onClick={() => startEdit(r)}>
                <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${r.active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-200 dark:bg-white/5 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-2xl">alarm</span>
                </div>
                <div>
                  <p className="text-sm font-black">{r.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-primary font-bold">{r.time}</p>
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <span key={idx} className={`text-[8px] font-black ${r.days.includes(idx) ? 'text-primary' : 'text-gray-300 dark:text-gray-700'}`}>{day}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onUpdateReminder({ ...r, active: !r.active })} 
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${r.active ? 'bg-primary shadow-md' : 'bg-gray-300 dark:bg-white/10'}`}
                >
                  <div className={`size-4 bg-white rounded-full transition-transform ${r.active ? 'translate-x-6' : ''}`} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteReminder(r.id); }} 
                  className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity p-2 hover:bg-red-500/10 rounded-full"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onLogout} className="w-full p-5 bg-red-500/10 text-red-500 rounded-[32px] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 active:bg-red-500/20 transition-all border border-red-500/5 mt-6">
        <span className="material-symbols-outlined">logout</span> Log Out of Session
      </button>
    </div>
  );
};

export default Settings;
