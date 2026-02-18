
import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry, MediaAttachment, Mood } from '../types.ts';
import { analyzeEntry } from '../services/geminiService.ts';

interface EditorProps {
  entry?: DiaryEntry;
  onSave: (entry: DiaryEntry) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const MAX_IMAGES = 50;
const MAX_VIDEO_SIZE_MB = 250;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const Editor: React.FC<EditorProps> = ({ entry, onSave, onBack, onDelete }) => {
  const [content, setContent] = useState(entry?.content || '');
  const [title, setTitle] = useState(entry?.title || '');
  const [mood, setMood] = useState<Mood>(entry?.mood || 'none');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [media, setMedia] = useState<MediaAttachment[]>(entry?.media || []);
  const [location, setLocation] = useState(entry?.location);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  // Camera & Recording States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'none' | 'audio' | 'video'>('none');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setContent(prev => prev + (prev.length > 0 ? ' ' : '') + finalTranscript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      stopEverything();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleAIAnalysis = async () => {
    if (!content.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeEntry(content);
      if (result) {
        if (result.mood) setMood(result.mood.toLowerCase() as Mood);
        if (result.tags && Array.isArray(result.tags)) {
          const combinedTags = Array.from(new Set([...tags, ...result.tags.map((t: string) => t.replace('#', ''))]));
          setTags(combinedTags);
        }
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startCameraPreview = async () => {
    try {
      const constraints = { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;
      setIsCameraOpen(true);
      
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Camera access denied or not available.");
    }
  };

  const startRecording = (type: 'audio' | 'video') => {
    if (!videoStreamRef.current && type === 'video') return;

    try {
      const setupAudioRecorder = async () => {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        videoStreamRef.current = audioStream;
        initRecorder(audioStream, 'audio');
      };

      const initRecorder = (mediaStream: MediaStream, rType: 'audio' | 'video') => {
        const options = { mimeType: rType === 'video' ? 'video/webm;codecs=vp8,opus' : 'audio/webm;codecs=opus' };
        const recorder = MediaRecorder.isTypeSupported(options.mimeType) 
          ? new MediaRecorder(mediaStream, options) 
          : new MediaRecorder(mediaStream);
          
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const finalBlob = new Blob(audioChunksRef.current, { type: rType === 'video' ? 'video/webm' : 'audio/webm' });
          
          if (rType === 'video' && finalBlob.size > MAX_VIDEO_SIZE_BYTES) {
            alert(`Video exceeds ${MAX_VIDEO_SIZE_MB}MB limit and cannot be attached.`);
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            setMedia(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              type: rType,
              url: e.target?.result as string,
              duration: durationRef.current,
              size: finalBlob.size
            }]);
          };
          reader.readAsDataURL(finalBlob);
          if (rType === 'audio') {
            mediaStream.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setRecordingMode(rType);
        setRecordingDuration(0);
        durationRef.current = 0;
        
        timerIntervalRef.current = window.setInterval(() => {
          setRecordingDuration(prev => {
            const next = prev + 1;
            durationRef.current = next;
            return next;
          });
        }, 1000);
      };

      if (type === 'video') {
        initRecorder(videoStreamRef.current!, 'video');
      } else {
        setupAudioRecorder();
      }
    } catch (err) {
      console.error("Recording start failed", err);
    }
  };

  const stopRecordingAction = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingMode('none');
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recordingMode !== 'video') {
      stopEverything();
    }
  };

  const stopEverything = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordingMode('none');
    setIsCameraOpen(false);
  };

  const handleSave = () => {
    onSave({
      id: entry?.id || Date.now().toString(),
      title: title || 'Untitled Entry',
      content,
      date: entry?.date || new Date().toISOString(),
      mood,
      tags,
      media,
      isFavorite: entry?.isFavorite || false,
      location
    });
  };

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const toggleVoiceToText = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        alert("Speech recognition not supported or already running.");
      }
    }
  };

  const handleGetLocation = () => {
    if (isFetchingLocation) return;
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsFetchingLocation(false);
      },
      (err) => {
        console.error("Location error", err);
        alert("Could not retrieve location. Please check permissions.");
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const MOOD_EMOJIS: Record<string, string> = {
    happy: '😊',
    neutral: '😐',
    sad: '😔',
    excited: '🤩',
    peaceful: '🧘',
    work: '💼',
    none: '😶'
  };

  const currentImageCount = media.filter(m => m.type === 'image').length;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#191121] relative select-none">
      {(isCameraOpen || recordingMode === 'audio') && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          {isCameraOpen && (
            <div className="relative w-full h-full">
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover opacity-90 scale-x-[-1]" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
              <div className="absolute top-12 left-0 right-0 px-6 flex items-center justify-between z-10">
                <button onClick={stopEverything} className="size-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">close</span>
                </button>
                {recordingMode === 'video' && (
                  <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-2xl animate-pulse">
                    <span className="size-2 bg-white rounded-full"></span>
                    {formatTime(recordingDuration)}
                  </div>
                )}
                <div className="size-10"></div>
              </div>
              <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-6 z-10">
                {recordingMode === 'none' ? (
                  <>
                    <p className="text-white/80 text-[11px] font-black uppercase tracking-[0.2em] drop-shadow-md text-center">
                      Max {MAX_VIDEO_SIZE_MB}MB Video
                    </p>
                    <button onClick={() => startRecording('video')} className="size-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-[8px] border-white/20">
                      <div className="size-14 bg-red-600 rounded-full shadow-inner"></div>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-white/80 text-[11px] font-black uppercase tracking-[0.2em] drop-shadow-md">Recording Video...</p>
                    <button onClick={stopRecordingAction} className="size-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-[8px] border-white/20">
                      <div className="size-10 bg-red-600 rounded-lg shadow-inner"></div>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {recordingMode === 'audio' && !isCameraOpen && (
            <div className="flex flex-col items-center gap-8">
              <div className="size-40 rounded-full bg-primary/20 flex items-center justify-center animate-pulse border-4 border-primary/30">
                <span className="material-symbols-outlined text-7xl text-primary filled">mic</span>
              </div>
              <div className="text-center">
                <p className="text-white font-black tracking-[0.2em] uppercase text-xs mb-2">Recording Voice</p>
                <p className="text-primary text-4xl font-mono font-bold">{formatTime(recordingDuration)}</p>
              </div>
              <button onClick={stopRecordingAction} className="mt-12 size-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-[6px] border-white/20">
                <div className="size-8 bg-red-600 rounded-lg"></div>
              </button>
            </div>
          )}
        </div>
      )}

      <header className="px-4 py-3 flex items-center justify-between border-b border-primary/10 bg-white/80 dark:bg-[#191121]/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full active:bg-primary/10 text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold">{new Date(entry?.date || Date.now()).toLocaleDateString('default', { month: 'long', day: 'numeric' })}</h2>
          <div className="flex items-center justify-center gap-1">
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Memory Vault</span>
            {mood !== 'none' && <span className="text-xs">{MOOD_EMOJIS[mood]}</span>}
          </div>
        </div>
        <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">
          Save
        </button>
      </header>

      <main className="flex-1 flex flex-col px-6 py-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <input 
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Today's Title..."
            className="flex-1 text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-white/10 p-0"
          />
          <div className="flex items-center gap-1">
            <button 
              onClick={handleGetLocation}
              className={`size-10 rounded-full flex items-center justify-center transition-all ${isFetchingLocation ? 'animate-bounce text-primary' : location ? 'text-primary' : 'text-primary/40 hover:text-primary active:scale-90'}`}
              title="Add Location"
            >
              <span className={`material-symbols-outlined ${location ? 'filled' : ''}`}>location_on</span>
            </button>
            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || !content}
              className={`size-10 rounded-full flex items-center justify-center transition-all ${isAnalyzing ? 'animate-spin text-primary' : 'text-primary/40 hover:text-primary active:scale-90'}`}
              title="AI Analysis"
            >
              <span className="material-symbols-outlined filled">auto_awesome</span>
            </button>
          </div>
        </div>

        {location && (
          <div className="flex items-center gap-2 mb-4 bg-primary/5 rounded-full pl-3 pr-1 py-1 w-fit border border-primary/10 animate-in fade-in zoom-in-95">
            <span className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[12px]">explore</span>
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
            <button onClick={() => setLocation(undefined)} className="size-5 bg-primary/10 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-[10px]">close</span>
            </button>
          </div>
        )}

        <textarea 
          value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Speak your heart or write your story..."
          className="w-full flex-1 text-lg leading-relaxed bg-transparent border-none focus:ring-0 placeholder:text-primary/20 resize-none p-0 min-h-[200px]"
        />
        
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/5 shadow-sm">
              #{tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))} className="opacity-50 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))}
        </div>

        {media.length > 0 && (
          <div className="mt-8 pt-6 border-t border-primary/5">
            <div className="flex items-center justify-between mb-4 px-1">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Memories Attached</h3>
               <span className="text-[10px] font-bold text-primary/60">{currentImageCount}/{MAX_IMAGES} Photos</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {media.map(m => (
                <div key={m.id} className="relative flex-shrink-0 group">
                  {m.type === 'image' && (
                    <div className="size-32 rounded-3xl bg-cover bg-center border-2 border-white dark:border-white/5 shadow-xl transition-transform hover:scale-105" style={{ backgroundImage: `url(${m.url})` }} />
                  )}
                  {m.type === 'video' && (
                    <div className="size-32 rounded-3xl bg-black border-2 border-white dark:border-white/5 shadow-xl overflow-hidden relative transition-transform hover:scale-105">
                      <video src={m.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">play_circle</span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white font-bold">
                        {formatTime(m.duration || 0)}
                      </div>
                    </div>
                  )}
                  {m.type === 'audio' && (
                    <div className="size-32 rounded-3xl bg-primary/5 border-2 border-primary/10 shadow-xl flex flex-col justify-center items-center gap-1 transition-transform hover:scale-105">
                      <span className="material-symbols-outlined text-primary text-4xl">mic</span>
                      <span className="text-[9px] font-black text-primary uppercase">Voice Note</span>
                      <span className="text-[8px] text-primary/60">{formatTime(m.duration || 0)}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setMedia(media.filter(x => x.id !== m.id))}
                    className="absolute -top-2 -right-2 size-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-75 transition-transform z-10"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="px-4 py-4 border-t border-primary/10 bg-white/80 dark:bg-[#191121]/80 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (currentImageCount >= MAX_IMAGES) {
                  alert(`You can only attach up to ${MAX_IMAGES} images per memory.`);
                  return;
                }
                fileInputRef.current?.click();
              }} 
              className="size-12 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-transform shadow-sm"
              title="Add Image"
            >
              <span className="material-symbols-outlined">add_a_photo</span>
            </button>
            <button 
              onClick={startCameraPreview} 
              className="size-12 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-transform shadow-sm"
              title="Open Camera"
            >
              <span className="material-symbols-outlined">videocam</span>
            </button>
            <button 
              onClick={() => startRecording('audio')} 
              className="size-12 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-transform shadow-sm"
              title="Record Voice"
            >
              <span className="material-symbols-outlined">mic</span>
            </button>
            <button 
              onClick={toggleVoiceToText} 
              className={`size-12 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}
              title="Dictation"
            >
              <span className="material-symbols-outlined">settings_voice</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={(e) => {
              const files = e.target.files;
              if (files) {
                Array.from(files).forEach((f: any) => {
                  const isImage = f.type.startsWith('image/');
                  const isVideo = f.type.startsWith('video/');

                  if (isImage && (currentImageCount + media.filter(m => m.type === 'image').length >= MAX_IMAGES)) {
                    // This logic is a bit simple for bulk uploads but handles the basic case
                    return;
                  }

                  if (isVideo && f.size > MAX_VIDEO_SIZE_BYTES) {
                    alert(`Video file "${f.name}" exceeds the ${MAX_VIDEO_SIZE_MB}MB limit.`);
                    return;
                  }

                  const r = new FileReader();
                  r.onload = (ev) => {
                    setMedia(p => [...p, { 
                      id: Math.random().toString(36).substr(2, 9), 
                      type: isImage ? 'image' : 'video', 
                      url: ev.target?.result as string,
                      size: f.size
                    }]);
                  };
                  r.readAsDataURL(f);
                });
              }
            }} />
          </div>
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1 bg-primary/5 rounded-2xl px-3 py-2 border border-primary/10 focus-within:border-primary/40 transition-all shadow-sm">
                <span className="material-symbols-outlined text-sm text-gray-400">tag</span>
                <input 
                  type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()} 
                  placeholder="New tag..." 
                  className="bg-transparent border-none text-[12px] w-20 p-0 font-bold focus:ring-0 placeholder:text-gray-400" 
                />
                <button onClick={handleAddTag} className="text-primary hover:scale-110 active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Editor;
