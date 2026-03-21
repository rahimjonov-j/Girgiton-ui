import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ShoppingBag, Check, Search } from 'lucide-react';
import { CATEGORIES, MENU_ITEMS } from '../data/menuData.js';
import { useOrderStore } from '../store/useOrderStore.js';
import logo from '../assets/logo.png';

const MenuItemCard = React.memo(function MenuItemCard({ item, onAdd, selectedQty }) {
  const lastTapRef = useRef(0);
  const isSelected = selectedQty > 0;

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      onAdd(item);
    }
    lastTapRef.current = now;
  };

  return (
    <div
      onClick={handleTap}
      className={`flex items-center gap-4 py-4 border-b border-zinc-100 last:border-0 transition-all cursor-pointer select-none rounded-2xl px-3 -mx-3 ${
        isSelected ? 'bg-green-50' : 'active:bg-zinc-50'
      }`}
    >
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 shadow-sm flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-zinc-300 text-3xl">🍽️</span>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
            <Check className="w-6 h-6 text-white drop-shadow-md" strokeWidth={3} />
            {selectedQty > 1 && (
              <span className="text-white text-sm font-black drop-shadow-md">×{selectedQty}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 py-1">
        <h4 className={`font-bold text-base leading-tight ${isSelected ? 'text-green-800' : 'text-zinc-900'}`}>
          {item.name}
        </h4>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed pr-2">{item.description}</p>
        <div className="flex items-center mt-3">
          <span className={`font-black text-base ${isSelected ? 'text-green-700' : 'text-zinc-900'}`}>
            {item.price.toLocaleString()} so'm
          </span>
          <span className="text-xs text-zinc-400 ml-1.5 font-medium">/ 1 dona</span>
          <span
            className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
              item.status === 'mavjud'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {item.status === 'mavjud' ? 'Mavjud' : 'Tayyorlanmoqda'}
          </span>
        </div>
      </div>
    </div>
  );
});

const EXTENDED_CATEGORIES = [{ id: 'all', label: 'Barchasi', icon: '🍽️' }, ...CATEGORIES];

export default function MenuPanel({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const { addItem, setState, state } = useOrderStore();
  const searchInputRef = useRef(null);

  const filtered = MENU_ITEMS.filter(i => {
    const matchesCat = activeCategory === 'all' || i.category === activeCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAdd = useCallback((item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const handleOrder = () => {
    selectedItems.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        addItem({ name: item.name, price: item.price });
      }
    });
    if (state === 'idle' || state === 'error') {
      setState('preview');
    }
    setSelectedItems([]);
    onClose();
  };

  const totalSelected = selectedItems.reduce((a, i) => a + i.qty, 0);

  // Swipe logic
  const touchX = useRef(0);
  const touchY = useRef(0);

  const handleTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;

    if (Math.abs(dx) > 60 && Math.abs(dy) < 100) {
      if (dx > 0) {
        const idx = EXTENDED_CATEGORIES.findIndex(c => c.id === activeCategory);
        if (idx === 0) {
          onClose(); 
        } else {
          setActiveCategory(EXTENDED_CATEGORIES[idx - 1].id);
        }
      } else {
        const idx = EXTENDED_CATEGORIES.findIndex(c => c.id === activeCategory);
        if (idx < EXTENDED_CATEGORIES.length - 1) {
          setActiveCategory(EXTENDED_CATEGORIES[idx + 1].id);
        }
      }
    }
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Keep active category in view
  useEffect(() => {
    const el = document.getElementById(`category-btn-${activeCategory}`);
    const container = document.getElementById('category-scroll-container');
    if (el && container) {
      // scrollIntoView works but can jump the whole page. 
      // Better to calculate offset to smoothly scroll container horizontally.
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const catTitle = EXTENDED_CATEGORIES.find(c => c.id === activeCategory)?.label || 'Menyu';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="relative shrink-0 pt-10 pb-4">
          <button onClick={onClose} className="absolute top-6 right-4 p-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center bg-white">
            <img src={logo} alt="Rayhon Logo" className="h-[46px] mx-auto object-contain mix-blend-multiply contrast-125 brightness-110" />
            <p className="text-[13px] text-green-600 font-semibold uppercase tracking-wider mt-2">taomlari menyusi</p>
          </div>
        </div>

        {showSearch && (
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-full border-2 border-green-500 outline-none text-base font-medium placeholder:text-zinc-400 bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex items-center px-5 py-2 shrink-0">
          <div id="category-scroll-container" className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide pr-2 scroll-smooth">
            {EXTENDED_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                id={`category-btn-${cat.id}`}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'border-green-500 text-green-700 bg-green-50 shadow-sm'
                    : 'border-zinc-200 text-zinc-600 bg-white hover:border-zinc-300'
                }`}
              >
                <span className="text-base opacity-70">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          
          {!showSearch && (
            <div className="flex items-center shrink-0 pl-2 ml-1 border-l border-zinc-200 space-x-2 bg-white relative z-10">
              <button
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 rounded-full border border-green-200 flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="px-6 pt-5 pb-2 shrink-0">
          <h3 className="font-bold text-zinc-900 text-xl tracking-tight">{catTitle}</h3>
          <p className="text-[13px] font-medium text-zinc-500 mt-0.5">{filtered.length} ta taom</p>
        </div>

        <div
          className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-[90px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filtered.map(item => {
                const sel = selectedItems.find(s => s.id === item.id);
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAdd={handleAdd}
                    selectedQty={sel ? sel.qty : 0}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3 pb-20">
              <Search className="w-10 h-10 opacity-20" />
              <p className="font-medium text-sm">Taom topilmadi</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-linear-to-t from-white via-white to-transparent pt-10 pointer-events-none">
          <button
            onClick={handleOrder}
            disabled={totalSelected === 0}
            className="w-full h-[64px] bg-green-600 disabled:bg-zinc-200 text-white disabled:text-zinc-400 font-extrabold text-lg flex items-center justify-center gap-3 rounded-2xl shadow-xl transition-all active:scale-[0.98] pointer-events-auto"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />
            {totalSelected > 0
              ? `Buyurtma berish (${totalSelected} ta)`
              : 'Buyurtma berish'}
          </button>
        </div>
      </div>
    </>
  );
}
