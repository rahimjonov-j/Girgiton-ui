import React, { useState } from 'react';
import { ChevronUp, Plus } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore.js';
import { toast } from 'sonner';

const MENU_CATEGORIES = [
  {
    id: 'ovqatlar',
    name: 'Ovqatlar',
    items: [
      { name: 'Palov', price: 35000 },
      { name: 'Manti', price: 25000 },
      { name: 'Shashlik', price: 18000 },
      { name: 'Lag\'mon', price: 28000 },
      { name: 'Qozon kabob', price: 45000 },
    ]
  },
  {
    id: 'ichimliklar',
    name: 'Ichimliklar',
    items: [
      { name: 'Qora choy (choynak)', price: 5000 },
      { name: 'Ko\'k choy (choynak)', price: 5000 },
      { name: 'Limon choy', price: 10000 },
      { name: 'Coca Cola 1L', price: 12000 },
      { name: 'Fanta 1L', price: 12000 },
    ]
  },
  {
    id: 'salatlar',
    name: 'Salatlar',
    items: [
      { name: 'Achchiq-chuchuk', price: 10000 },
      { name: 'Svejiy salat', price: 15000 },
      { name: 'Mujskoy kapriz', price: 25000 },
    ]
  }
];

export default function CategorySheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(MENU_CATEGORIES[0].id);
  const { addItem, state } = useOrderStore();

  if (state === 'recording' || state === 'sending' || state === 'processing') return null;

  const handleAddItem = (item) => {
    addItem(item);
    toast.success(`${item.name} qo'shildi`);
    setIsOpen(false);
  };

  return (
    <div className="w-full relative z-30">
      <button 
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-6 py-4 rounded-full shadow-md text-zinc-700 dark:text-zinc-200 font-semibold active:scale-[0.98] transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none group"
      >
        <span className="text-base tracking-wide flex items-center justify-center w-full relative">Menyudan qo'shish
        <ChevronUp className={`w-5 h-5 absolute right-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/60 dark:bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div 
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-50 flex flex-col ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
        style={{ height: '75vh' }}
      >
        <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-4 mb-2 shrink-0 pointer-events-none"></div>
        <div className="px-6 pt-3 pb-4 shrink-0">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Kategoriya</h2>
        </div>
        <div className="px-6 border-b border-zinc-100 dark:border-zinc-800 flex overflow-x-auto scrollbar-hide gap-2 pb-4 shrink-0">
          {MENU_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === category.id 
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-md scale-105' 
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900/50 focus:bg-zinc-200 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="p-6 overflow-y-auto scrollbar-hide flex-1 pb-[100px]">
          <div className="flex flex-col gap-3">
            {MENU_CATEGORIES.find(c => c.id === activeTab)?.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 transition-all shadow-sm group hover:border-zinc-300 dark:hover:border-zinc-700">
                <div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-1">{item.price.toLocaleString()} so'm</p>
                </div>
                <button 
                  onClick={() => handleAddItem(item)}
                  className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-black rounded-full text-zinc-600 dark:text-zinc-300 transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
