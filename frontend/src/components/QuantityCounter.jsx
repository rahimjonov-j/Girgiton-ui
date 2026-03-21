import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore.js';

export default function QuantityCounter({ id, qty }) {
  const { updateItemQty } = useOrderStore();

  return (
    <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <button 
        onClick={() => updateItemQty(id, -1)}
        className="p-2 sm:p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:scale-95 touch-manipulation"
      >
        <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      
      <span className="w-6 sm:w-8 text-center font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 select-none">
        {qty}
      </span>
      
      <button 
        onClick={() => updateItemQty(id, 1)}
        className="p-2 sm:p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:scale-95 touch-manipulation"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
