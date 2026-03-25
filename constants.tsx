
import React from 'react';
import { Mic, Drum, Speaker, Music, Activity, Guitar, Piano } from 'lucide-react';
import { StemType } from './types';

export const STEM_CONFIG = {
  [StemType.VOCALS]: { color: '#ec4899', icon: <Mic size={18} /> },
  [StemType.DRUMS]: { color: '#3b82f6', icon: <Drum size={18} /> },
  [StemType.BASS]: { color: '#f59e0b', icon: <Speaker size={18} /> },
  [StemType.SYNTH]: { color: '#10b981', icon: <Music size={18} /> },
  [StemType.PADS]: { color: '#8b5cf6', icon: <Activity size={18} /> },
  [StemType.GUITAR]: { color: '#ef4444', icon: <Guitar size={18} /> },
  [StemType.PIANO]: { color: '#ffffff', icon: <Piano size={18} /> },
};

export const INITIAL_TRACKS = [];
