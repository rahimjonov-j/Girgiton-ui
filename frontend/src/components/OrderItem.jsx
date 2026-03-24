import React, { useState, useRef, memo } from 'react';
import { useOrderStore } from '../store/useOrderStore.js';
import QuantityCounter from './QuantityCounter.jsx';
import { toast } from 'sonner';

const OrderItem = memo(function OrderItem({ item }) {
  const { removeItem } = useOrderStore();

  // Swipe-to-delete state
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const DELETE_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    touchCurrentX.current = e.touches[0].clientX;
    // Only allow right swipe
    if (dx > 0) {
      setTranslateX(Math.max(0, Math.min(dx, 110)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX > DELETE_THRESHOLD) {
      // Animate out to the right then delete
      setTranslateX(400);
      setDeleted(true);
      setTimeout(() => {
        removeItem(item.id || item.nomi);
        toast.success("O'chirildi");
      }, 280);
    } else {
      setTranslateX(0);
    }
  };

  if (deleted) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete hint behind the card on the left */}
      <div 
        className="absolute inset-y-0 left-0 flex items-center justify-start pl-5 bg-red-500 rounded-2xl w-full"
        style={{ opacity: translateX > 0 ? 1 : 0 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m2-3h6a1 1 0 011 1v1H7V5a1 1 0 011-1z"
          />
        </svg>
      </div>

      {/* Main card */}
      <div
        className="relative bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-zinc-200 group"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-zinc-900 truncate leading-tight">
            {item.nomi}
          </h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            {item.miqdor} {item.birlik}
          </p>
        </div>

        {/* Right: quantity counter only */}
        <div className="flex items-center justify-end">
          <QuantityCounter id={item.id || item.nomi} qty={item.miqdor} />
        </div>
      </div>
    </div>
  );
});

export default OrderItem;
