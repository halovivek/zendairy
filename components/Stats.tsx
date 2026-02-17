
import React, { useMemo } from 'react';
import { DiaryEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface StatsProps {
  entries: DiaryEntry[];
}

const Stats: React.FC<StatsProps> = ({ entries }) => {
  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      if (e.mood !== 'none') {
        counts[e.mood] = (counts[e.mood] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const activityData = useMemo(() => {
    // Last 7 days
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('default', { weekday: 'short' });
    });

    const data = days.map(day => ({ day, count: 0 }));
    entries.forEach(e => {
      const entryDay = new Date(e.date).toLocaleDateString('default', { weekday: 'short' });
      const found = data.find(d => d.day === entryDay);
      if (found) found.count += 1;
    });
    return data;
  }, [entries]);

  const MOOD_COLORS: Record<string, string> = {
    happy: '#fbbf24',
    peaceful: '#10b981',
    excited: '#f472b6',
    sad: '#6366f1',
    neutral: '#94a3b8',
    work: '#8c36e2'
  };

  return (
    <div className="px-6 py-8 pb-32">
      <h2 className="text-2xl font-bold mb-6">Your Insights</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-primary/10 p-4 rounded-3xl border border-primary/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-1">Total Memories</p>
          <h3 className="text-2xl font-bold text-primary">{entries.length}</h3>
        </div>
        <div className="bg-green-500/10 p-4 rounded-3xl border border-green-500/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-600/60 mb-1">Writing Streak</p>
          <h3 className="text-2xl font-bold text-green-600">12 Days</h3>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-background-light/50 dark:bg-primary/5 p-6 rounded-3xl border border-primary/5 mb-8">
        <h4 className="text-sm font-bold mb-6">Writing Activity</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#8c36e2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mood Chart */}
      <div className="bg-background-light/50 dark:bg-primary/5 p-6 rounded-3xl border border-primary/5">
        <h4 className="text-sm font-bold mb-4">Mood Distribution</h4>
        {moodData.length > 0 ? (
          <div className="flex items-center">
            <div className="h-48 w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodData}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {moodData.map(mood => (
                <div key={mood.name} className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: MOOD_COLORS[mood.name] }}></div>
                  <span className="text-xs font-bold capitalize">{mood.name}</span>
                  <span className="text-[10px] text-gray-400">{Math.round((mood.value / entries.length) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400 text-xs italic">
            Analyze more entries to see mood trends
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
