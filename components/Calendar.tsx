
import React, { useState } from 'react';
import { DiaryEntry } from '../types';

interface CalendarProps {
  entries: DiaryEntry[];
  onDateSelect: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ entries, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));

  const entryDates = new Set(entries.map(e => e.date.split('T')[0]));

  return (
    <div className="px-6 py-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-primary/10 text-primary">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-sm font-bold w-32 text-center">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-primary/10 text-primary">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-2">{d}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasEntry = entryDates.has(dateString);
          const isToday = new Date().toISOString().split('T')[0] === dateString;

          return (
            <button 
              key={day}
              onClick={() => onDateSelect(dateString)}
              className={`h-12 flex flex-col items-center justify-center rounded-2xl transition-all relative group
                ${isToday ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-primary/5'}
              `}
            >
              <span className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>{day}</span>
              {hasEntry && (
                <div className="size-1.5 bg-primary rounded-full mt-1"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <p className="text-xs text-primary font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">info</span>
          Tap a date to view or create an entry for that day.
        </p>
      </div>
    </div>
  );
};

export default Calendar;
