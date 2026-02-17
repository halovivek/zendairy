
export type Mood = 'happy' | 'neutral' | 'sad' | 'excited' | 'peaceful' | 'work' | 'none';

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string; // ISO string
  mood: Mood;
  tags: string[];
  media: MediaAttachment[];
  isFavorite: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // HH:mm
  days: number[]; // 0-6
  active: boolean;
}

export type AppView = 'login' | 'home' | 'editor' | 'stats' | 'calendar' | 'settings';

export interface User {
  name: string;
  email: string;
  profilePic: string;
  isSynced: boolean;
}
