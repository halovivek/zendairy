
import React from 'react';
import { AppView } from '../types';

interface BottomNavProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onAddClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange, onAddClick }) => {
  const items = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'calendar', icon: 'calendar_today', label: 'Calendar' },
    { id: 'stats', icon: 'analytics', label: 'Stats' },
    { id: 'settings', icon: 'settings', label: 'Settings' }
  ];

  return (
    <nav className="absolute bottom-0 left-0 w-full bg-white/90 dark:bg-[#251b2e]/90 backdrop-blur-lg border-t border-primary/10 px-6 py-3 flex items-center justify-between z-40">
      {items.slice(0, 2).map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id as AppView)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentView === item.id ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined ${currentView === item.id ? 'filled' : ''}`}>{item.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
        </button>
      ))}

      {/* Primary Action FAB */}
      <button 
        onClick={onAddClick}
        className="size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center -mt-10 hover:scale-110 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {items.slice(2).map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id as AppView)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentView === item.id ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined ${currentView === item.id ? 'filled' : ''}`}>{item.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
