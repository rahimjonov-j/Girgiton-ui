import React, { useState, useRef } from 'react';
import { X, ShoppingBag, Check } from 'lucide-react';
import { CATEGORIES, MENU_ITEMS } from '../data/menuData.js';
import { useOrderStore } from '../store/useOrderStore.js';

function MenuItemCard({ item, onAdd, selectedQty }) {
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
      className={`flex items-center gap-3 py-4 border-b border-zinc-100 last:border-0 transition-all cursor-pointer select-none rounded-xl px-2 -mx-2 ${
        isSelected ? 'bg-green-50' : 'active:bg-green-50'
      }`}
    >
      {/* Image with check overlay */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-100 flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-zinc-300 text-2xl">🍽️</span>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center gap-0.5">
            <Check className="w-5 h-5 text-white" strokeWidth={3} />
            {selectedQty > 1 && (
              <span className="text-white text-xs font-bold">×{selectedQty}</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-sm leading-tight ${isSelected ? 'text-green-800' : 'text-zinc-900'}`}>
          {item.name}
        </h4>
        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`font-bold text-sm ${isSelected ? 'text-green-700' : 'text-zinc-900'}`}>
            {item.price.toLocaleString()} so'm
          </span>
          <span className="text-xs text-zinc-400">/ 1 porsiya</span>
          <span
            className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
              item.status === 'mavjud'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-50 text-red-400'
            }`}
          >
            {item.status === 'mavjud' ? 'Mavjud' : 'Tayyorlanmoqda'}
          </span>
        </div>
      </div>
    </div>
  );
}


export default function MenuPanel({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState('salat');
  const [selectedItems, setSelectedItems] = useState([]);
  const { addItem, setState, state } = useOrderStore();

  const filtered = MENU_ITEMS.filter(i => i.category === activeCategory);

  const handleAdd = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleOrder = () => {
    selectedItems.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        addItem({ name: item.name, price: item.price });
      }
    });
    // ensure we are in preview state
    if (state === 'idle' || state === 'error') {
      setState('preview');
    }
    setSelectedItems([]);
    onClose();
  };

  const totalSelected = selectedItems.reduce((a, i) => a + i.qty, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-green-800 italic">Rayhon</span>
              <span className="text-green-500 text-lg">🌿</span>
            </div>
            <p className="text-xs text-green-600 font-medium">taomlari menyusi</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-zinc-50">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Category Title */}
        <div className="px-5 pt-4 pb-1">
          <h3 className="font-bold text-zinc-900 text-lg">
            {CATEGORIES.find(c => c.id === activeCategory)?.label}
          </h3>
          <p className="text-xs text-zinc-400">{filtered.length} ta taom</p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
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

        {/* Fixed Order Button */}
        <div className="px-0 pb-0">
          <button
            onClick={handleOrder}
            disabled={totalSelected === 0}
            className="w-full h-[60px] bg-green-500 disabled:bg-green-200 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalSelected > 0
              ? `Buyurtma berish (${totalSelected} ta)`
              : 'Buyurtma berish'}
          </button>
        </div>
      </div>
    </>
  );
}
