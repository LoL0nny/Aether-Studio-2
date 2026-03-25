
import React, { useMemo, useState, useEffect } from 'react';

interface WaveformProps {
  intensity: number;
  color: string;
  isPlaying: boolean;
  height?: number;
}

const Waveform: React.FC<WaveformProps> = ({ intensity, color, isPlaying, height = 40 }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    
    let frameId: number;
    const update = () => {
      setTime(prev => prev + 1);
      frameId = requestAnimationFrame(update);
    };
    
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  const bars = useMemo(() => {
    // Deterministic "random" values based on index
    return Array.from({ length: 60 }).map((_, i) => {
      const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453123;
      const pseudoRandom = seed - Math.floor(seed);
      return {
        baseHeight: pseudoRandom * intensity * height + 2,
        variance: pseudoRandom * 5 + 2
      };
    });
  }, [intensity, height]);

  return (
    <div className="flex items-center gap-[2px] h-full w-full overflow-hidden">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-300"
          style={{
            backgroundColor: color,
            height: isPlaying 
              ? `${bar.baseHeight + (Math.sin(time / 10 + i) * bar.variance)}px` 
              : `${bar.baseHeight}px`,
            opacity: 0.6 + (intensity * 0.4)
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
