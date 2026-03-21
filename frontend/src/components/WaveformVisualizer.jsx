import React from 'react';

export default function WaveformVisualizer({ isRecording }) {
  if (!isRecording) return null;

  return (
    <div className="absolute -top-16 flex items-end justify-center h-14 gap-[3px] px-5 py-3 bg-zinc-950 dark:bg-zinc-100 rounded-2xl shadow-xl pointer-events-none transition-all duration-300 ease-out origin-bottom scale-100 opacity-100 translate-y-0">
      <span className="text-sm font-bold text-white dark:text-black mr-3 uppercase tracking-wider h-full flex items-center">Gapiring...</span>
      <div className="flex items-center gap-1 h-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="w-1 rounded-full animate-waveform bg-zinc-400 dark:bg-zinc-600"
            style={{
              height: '100%',
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
      </div>
      
      {/* Tooltip triangle */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-950 dark:bg-zinc-100 rotate-45 rounded-sm" />
    </div>
  );
}
