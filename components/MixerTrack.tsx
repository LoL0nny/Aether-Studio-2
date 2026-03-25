
import React, { useEffect, useState } from 'react';
import { AudioTrack } from '../types';
import { STEM_CONFIG } from '../constants';
import { Link2 } from 'lucide-react';

interface MixerTrackProps {
  track: AudioTrack;
  allTracks: AudioTrack[];
  onUpdate: (id: string, updates: Partial<AudioTrack>) => void;
  isPlaying?: boolean;
}

const MixerTrack: React.FC<MixerTrackProps> = ({ track, allTracks, onUpdate, isPlaying }) => {
  const config = STEM_CONFIG[track.type];
  const [meterLevel, setMeterLevel] = useState(0);

  useEffect(() => {
    if (isPlaying && !track.isMuted) {
      const interval = window.setInterval(() => {
        const base = track.volume * 70;
        const bounce = Math.random() * 20;
        setMeterLevel(Math.min(100, base + bounce));
      }, 80);
      return () => {
        clearInterval(interval);
        setMeterLevel(0);
      };
    }
  }, [isPlaying, track.isMuted, track.volume]);

  const getPanLabel = (val: number) => {
    if (Math.abs(val) < 0.1) return 'C';
    return val < 0 ? `${Math.abs(Math.round(val * 100))}L` : `${Math.round(val * 100)}R`;
  };

  const handleEqChange = (band: 'low' | 'mid' | 'high', value: number) => {
    onUpdate(track.id, {
      eq: {
        ...track.eq,
        [band]: value
      }
    });
  };

  return (
    <div className="flex flex-col items-center bg-zinc-900/60 rounded-[2.5rem] p-5 w-32 border border-zinc-800/50 hover:border-zinc-700/50 transition-all shadow-2xl relative overflow-hidden group min-h-[550px]">
      <div 
        className="absolute top-0 left-0 right-0 h-1" 
        style={{ backgroundColor: track.color }} 
      />
      
      <div className="flex flex-col items-center gap-2 mb-4 mt-2">
        <div 
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border border-white/5 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${track.color}15`, color: track.color, boxShadow: `0 0 20px ${track.color}10` }}
        >
          {config.icon}
        </div>
        <span className="text-[9px] font-black text-zinc-400 truncate w-full text-center uppercase tracking-widest px-1">
          {track.name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 w-full mb-4">
        <button 
          onClick={() => onUpdate(track.id, { isMuted: !track.isMuted })}
          className={`py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all border ${
            track.isMuted 
              ? 'bg-red-600 border-red-500 text-white shadow-lg' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Mute
        </button>
        <button 
          onClick={() => onUpdate(track.id, { isSolo: !track.isSolo })}
          className={`py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all border ${
            track.isSolo 
              ? 'bg-yellow-500 border-yellow-400 text-zinc-900 shadow-lg' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Solo
        </button>
      </div>

      {/* Sidechain Section */}
      <div className="w-full mb-4 px-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Link2 size={10} className="text-zinc-600" />
          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Sidechain</span>
        </div>
        <select 
          value={track.sidechainSourceId || ''}
          onChange={(e) => onUpdate(track.id, { sidechainSourceId: e.target.value || undefined })}
          className="w-full bg-black/40 border border-zinc-800 rounded-lg p-1.5 text-[8px] font-bold text-zinc-400 outline-none hover:border-zinc-700 transition-all"
        >
          <option value="">None</option>
          {allTracks.filter(t => t.id !== track.id).map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* 3-Band EQ Section */}
      <div className="w-full flex flex-col gap-3 mb-4 p-2 bg-black/20 rounded-2xl border border-zinc-800/50">
        <div className="flex flex-col gap-1">
           <div className="flex justify-between text-[6px] font-black text-zinc-600 uppercase tracking-widest">
             <span>HI</span>
             <span className={track.eq.high !== 0 ? 'text-pink-500' : ''}>{track.eq.high}dB</span>
           </div>
           <input 
             type="range" min="-12" max="12" step="0.5" value={track.eq.high} 
             onChange={(e) => handleEqChange('high', parseFloat(e.target.value))}
             className="w-full accent-pink-600 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer"
           />
        </div>
        <div className="flex flex-col gap-1">
           <div className="flex justify-between text-[6px] font-black text-zinc-600 uppercase tracking-widest">
             <span>MID</span>
             <span className={track.eq.mid !== 0 ? 'text-indigo-500' : ''}>{track.eq.mid}dB</span>
           </div>
           <input 
             type="range" min="-12" max="12" step="0.5" value={track.eq.mid} 
             onChange={(e) => handleEqChange('mid', parseFloat(e.target.value))}
             className="w-full accent-indigo-600 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer"
           />
        </div>
        <div className="flex flex-col gap-1">
           <div className="flex justify-between text-[6px] font-black text-zinc-600 uppercase tracking-widest">
             <span>LO</span>
             <span className={track.eq.low !== 0 ? 'text-emerald-500' : ''}>{track.eq.low}dB</span>
           </div>
           <input 
             type="range" min="-12" max="12" step="0.5" value={track.eq.low} 
             onChange={(e) => handleEqChange('low', parseFloat(e.target.value))}
             className="w-full accent-emerald-600 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer"
           />
        </div>
      </div>

      <div className="w-full mb-6 flex flex-col items-center gap-1.5">
        <div className="flex justify-between w-full px-1">
          <span className="text-[7px] font-black text-zinc-600">L</span>
          <span className="text-[8px] font-black text-pink-500/80 tracking-tighter mono">{getPanLabel(track.pan)}</span>
          <span className="text-[7px] font-black text-zinc-600">R</span>
        </div>
        <div className="relative w-full h-1.5 bg-zinc-800/80 rounded-full border border-zinc-700/30">
          <input 
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={track.pan}
            onChange={(e) => onUpdate(track.id, { pan: parseFloat(e.target.value) })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-zinc-400 shadow-md pointer-events-none transition-transform"
            style={{ left: `calc(${(track.pan + 1) * 50}% - 6px)` }}
          />
        </div>
      </div>

      <div className="flex gap-4 h-44 w-full items-center justify-center">
        <div className="w-2.5 h-full bg-black/40 rounded-full border border-zinc-800/50 relative overflow-hidden flex flex-col justify-end p-[1px]">
          <div 
            className="w-full transition-all duration-75 rounded-full"
            style={{ 
              height: `${meterLevel}%`,
              background: meterLevel > 85 
                ? 'linear-gradient(to top, #10b981, #f59e0b, #ef4444)' 
                : meterLevel > 60 
                  ? 'linear-gradient(to top, #10b981, #f59e0b)' 
                  : '#10b981',
            }}
          />
        </div>

        <div className="relative h-full w-8 flex flex-col items-center">
          <div className="absolute inset-y-0 w-1 bg-zinc-800 rounded-full shadow-inner" />
          <input
            type="range"
            min="0"
            max="1.2"
            step="0.001"
            value={track.volume}
            onChange={(e) => onUpdate(track.id, { volume: parseFloat(e.target.value) })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 -rotate-180 fader-vertical"
            style={{ direction: 'rtl' }}
          />
          <div 
            className="absolute w-7 h-10 bg-zinc-300 rounded-md border-y border-zinc-400 shadow-xl flex flex-col items-center justify-center pointer-events-none"
            style={{ 
              bottom: `calc(${Math.min(100, (track.volume / 1.2) * 100)}% - 20px)`,
            }}
          >
            <div className="w-full h-[2px] bg-zinc-800/20 mb-[2px]" />
            <div className="absolute left-0 right-0 h-[2px]" style={{ backgroundColor: track.color }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MixerTrack;
