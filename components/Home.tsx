
import React, { useState, useMemo } from 'react';
import { DiaryEntry, User } from '../types.ts';

interface HomeProps {
  user: User;
  entries: DiaryEntry[];
  onEdit: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, entries, onEdit, onToggleFavorite }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'photos'>('all');

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = e.content.toLowerCase().includes(search.toLowerCase()) || 
                           e.title.toLowerCase().includes(search.toLowerCase()) ||
                           e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = activeFilter === 'all' ? true : 
                          activeFilter === 'favorites' ? e.isFavorite : 
                          e.media.some(m => m.type === 'image');
      return matchesSearch && matchesFilter;
    });
  }, [entries, search, activeFilter]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    filteredEntries.forEach(entry => {
      const date = new Date(entry.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#251b2e]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-primary/10">
        <div className="flex items-center gap-3">
          <img src={user.profilePic} className="size-10 rounded-full border-2 border-primary/20 object-cover" alt="Profile" />
          <div>
            <h1 className="text-sm font-bold text-primary">Good Morning, {user.name}</h1>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className="material-symbols-outlined text-[12px] text-green-500 filled">cloud_done</span>
              <span>Synced to Google Drive</span>
            </div>
          </div>
        </div>
        <button className="p-2 rounded-full bg-background-light dark:bg-primary/10 text-primary relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#251b2e]"></span>
        </button>
      </header>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary">search</span>
          <input 
            type="text" 
            placeholder="Search your memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background-light dark:bg-primary/5 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/30 placeholder:text-gray-400 text-sm transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Entries', icon: 'all_inbox' },
          { id: 'favorites', label: 'Favorites', icon: 'favorite' },
          { id: 'photos', label: 'Photos', icon: 'photo_library' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === filter.id 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'bg-primary/5 dark:bg-primary/10 text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-sm ${activeFilter === filter.id ? 'filled' : ''}`}>
              {filter.icon}
            </span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-4 space-y-8">
        {/* Cast Object.entries to ensure monthEntries is not inferred as unknown */}
        {(Object.entries(groupedEntries) as [string, DiaryEntry[]][]).map(([monthYear, monthEntries]) => (
          <div key={monthYear}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">{monthYear}</h3>
            <div className="space-y-4">
              {monthEntries.map(entry => (
                <div 
                  key={entry.id}
                  onClick={() => onEdit(entry.id)}
                  className="bg-background-light/50 dark:bg-primary/5 p-4 rounded-2xl border border-transparent hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-primary">
                      {new Date(entry.date).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(entry.id);
                        }}
                        className={`transition-transform active:scale-125 ${entry.isFavorite ? 'text-red-500' : 'text-gray-300'}`}
                      >
                        <span className={`material-symbols-outlined text-sm ${entry.isFavorite ? 'filled' : ''}`}>favorite</span>
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{entry.title || "Untilted Entry"}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {entry.content}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entry.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-white dark:bg-background-dark text-[10px] text-primary border border-primary/10">#{tag}</span>
                      ))}
                      {entry.tags.length > 2 && <span className="text-[10px] text-gray-400">+{entry.tags.length - 2}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      {entry.media.some(m => m.type === 'image') && <span className="material-symbols-outlined text-sm">image</span>}
                      {entry.media.some(m => m.type === 'video') && <span className="material-symbols-outlined text-sm">videocam</span>}
                      {entry.media.some(m => m.type === 'audio') && <span className="material-symbols-outlined text-sm">mic</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">edit_note</span>
            <p className="text-gray-400 font-medium">No memories yet. Start writing your story.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
