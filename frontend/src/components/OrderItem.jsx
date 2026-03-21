import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, Trash2 } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore.js';
import QuantityCounter from './QuantityCounter.jsx';
import { toast } from 'sonner';

export default function OrderItem({ item }) {
  const { updateItemName, removeItem } = useOrderStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.nomi);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== '') {
      updateItemName(item.id || item.nomi, editValue.trim());
      if (editValue.trim() !== item.nomi) toast.success("O'zgartirildi");
    } else {
      setEditValue(item.nomi);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    removeItem(item.id || item.nomi);
    toast.success("O'chirildi");
  };

  return (
    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800/60 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700 group">
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-zinc-100 dark:bg-zinc-950 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-zinc-400 text-base font-semibold text-zinc-900 dark:text-zinc-50 border border-transparent dark:border-zinc-800 transition-all shadow-inner"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        ) : (
          <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 truncate leading-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              {item.nomi}
            </h3>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
              {item.jami_narxi.toLocaleString()} <span className="text-xs font-medium text-zinc-400 mx-1">so'm</span>
            </p>
            {item.qoshimchalar?.length > 0 && (
              <p className="text-xs text-zinc-400 mt-0.5">+{item.qoshimchalar.map(q => q.nomi || q).join(', ')}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-950/50 p-2 sm:p-0 rounded-2xl sm:bg-transparent sm:dark:bg-transparent">
        <QuantityCounter id={item.id || item.nomi} qty={item.miqdor} />
        <div className="flex items-center gap-1 sm:border-l pl-3 dark:border-zinc-800/80 border-zinc-200">
          {isEditing ? (
            <button onPointerDown={(e) => { e.preventDefault(); handleSave(); }} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 rounded-full transition-all active:scale-90">
              <Check className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-full transition-all active:scale-90 hidden sm:flex">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleDelete} className="p-2 text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all active:scale-90">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
