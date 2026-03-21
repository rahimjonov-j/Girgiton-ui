import React from 'react';
import { Mic } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer.jsx';
import { useOrderStore } from '../store/useOrderStore.js';

export default function MicButton({ onStart, onStop }) {
  const { state } = useOrderStore();
  
  return (
    <div className="relative flex flex-col items-center">
      <WaveformVisualizer isRecording={state === 'recording'} />

      <button
        onPointerDown={onStart}
        onPointerUp={onStop}
        onPointerCancel={onStop}
        onPointerLeave={onStop}
        onContextMenu={(e) => e.preventDefault()} 
        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none select-none touch-none relative group ${
          state === 'recording' 
            ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.6)] text-white' 
            : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]'
        }`}
      >
        {state === 'recording' && (
          <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-20" />
        )}
        <Mic className={`w-8 h-8 sm:w-10 sm:h-10 transition-transform ${state === 'recording' ? 'animate-pulse scale-110' : 'group-hover:scale-110'}`} />
      </button>
    </div>
  );
}
