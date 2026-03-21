import React, { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, AlertCircle } from 'lucide-react';
import MicButton from '../components/MicButton.jsx';
import OrderItem from '../components/OrderItem.jsx';
import MenuPanel from '../components/MenuPanel.jsx';
import { useRecorder } from '../hooks/useRecorder.js';
import api from '../services/api.js';
import { useOrderStore } from '../store/useOrderStore.js';
import { toast } from 'sonner';

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64 ?? '');
    };
    reader.onerror = () => reject(new Error('Audio oqib bolmadi'));
    reader.readAsDataURL(blob);
  });

export default function VoiceOrderPage() {
  const recorder = useRecorder();
  const startTimeRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Swipe detection
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Swipe left: dx < -60 and mostly horizontal
    if (dx < -60 && Math.abs(dy) < 60) {
      setMenuOpen(true);
    }
  };

  const {
    state,
    parsedOrder,
    error,
    setState,
    setParsedOrder,
    setError,
    reset
  } = useOrderStore();

  const voiceOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/voice-order', payload);
      return data;
    },
    onSuccess: (data) => {
      setParsedOrder(data.order);
      setState('preview');
    },
    onError: (err) => {
      setState('error');
      const message = err?.response?.data?.message ?? 'Xatolik yuz berdi';
      setError(message);
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, updatedOrder }) => {
      const { data } = await api.patch(`/orders/${id}/status`, { status, parsedOrder: updatedOrder });
      return data.order;
    },
    onSuccess: () => {
      setState('idle');
      toast.success("Buyurtma muvaffaqiyatli jo'natildi! 🚀");
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playChime = (freq, startTime, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        const now = audioCtx.currentTime;
        playChime(523.25, now, 0.2);
        playChime(659.25, now + 0.15, 0.4);
      } catch (e) {}
      reset();
    },
    onError: (err) => {
      const message = err?.response?.data?.message ?? 'Xatolik yuz berdi';
      setError(message);
      setState('preview');
    }
  });

  const handleStartRecord = async () => {
    if (state === 'idle' || state === 'error' || state === 'preview') {
      setError(null);
      setState('recording');
      startTimeRef.current = Date.now();
      await recorder.start();
    }
  };

  const handleStopRecord = async () => {
    if (state !== 'recording') return;

    const duration = Date.now() - startTimeRef.current;
    if (duration < 500) {
      setState(parsedOrder ? 'preview' : 'idle');
      recorder.stop();
      return;
    }

    setState('processing');
    const result = await recorder.stop();
    if (!result) {
      setState(parsedOrder ? 'preview' : 'idle');
      setError('Audio topilmadi');
      return;
    }
    try {
      const audioBase64 = await toBase64(result.blob);
      await voiceOrderMutation.mutateAsync({
        audioBase64,
        mimeType: result.mimeType || 'audio/webm'
      });
    } catch (err) {
      setState('error');
      setError(err.message);
    }
  };

  const handleSend = async () => {
    if (!parsedOrder || parsedOrder.mahsulotlar.length === 0) return;

    // Detect if this is a locally-created (menu) order (uuid) vs a DB-backed voice order
    const isLocalOrder = !parsedOrder.id;

    setState('sending');

    try {
      if (isLocalOrder) {
        // Menu order — insert directly to DB via POST /orders
        await api.post('/orders', {
          mahsulotlar: parsedOrder.mahsulotlar,
          stol: parsedOrder.stol || 1,
          mijoz: parsedOrder.mijoz || 'Noma\'lum',
          hisob_kitob: parsedOrder.hisob_kitob,
          taxminiy_tolov_turi: 'naqd'
        });
      } else {
        // Voice order — update status in DB
        const orderId = parsedOrder.id;
        await api.patch(`/orders/${orderId}/status`, { status: 'NEW' });
      }

      setState('idle');
      toast.success("Buyurtma muvaffaqiyatli jo'natildi! 🚀");
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playChime = (freq, startTime, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        const now = audioCtx.currentTime;
        playChime(523.25, now, 0.2);
        playChime(659.25, now + 0.15, 0.4);
      } catch (e) {}
      reset();
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Xatolik yuz berdi';
      setError(message);
      setState('preview');
    }
  };

  const hasItems = parsedOrder && parsedOrder.mahsulotlar && parsedOrder.mahsulotlar.length > 0;

  return (
    <>
      <MenuPanel isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div
        className="min-h-screen bg-white flex justify-center items-start sm:items-center w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full max-w-md bg-white relative min-h-screen flex flex-col overflow-hidden sm:border-x border-zinc-100 shadow-none">

          <main className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-12 pb-[160px] flex flex-col gap-4">

            {/* Inline Error Banner */}
            {state === 'error' && error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Xatolik yuz berdi</p>
                  <p className="text-xs text-red-500 mt-0.5">{error}</p>
                </div>
                <button
                  onClick={() => { setError(null); setState('idle'); }}
                  className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {hasItems && (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-green-600 ml-2 text-xs tracking-widest uppercase">Yangi buyurtma</h3>
                {parsedOrder.mahsulotlar.map((item, idx) => (
                  <OrderItem key={item.id || item.nomi || idx} item={item} />
                ))}
                <div className="mt-2 p-5 bg-green-50 text-green-900 border border-green-100 rounded-2xl flex justify-between items-center shadow-sm">
                  <span className="font-medium text-sm text-green-700">Jami (qoralama)</span>
                  <span className="font-bold text-xl">{parsedOrder.hisob_kitob?.umumiy_summa?.toLocaleString() || 0} so'm</span>
                </div>
              </div>
            )}

            {state === 'processing' && (
              <div className="p-5 rounded-2xl border border-zinc-100 bg-white shadow-sm flex items-center gap-4 animate-pulse mt-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex justify-center items-center shrink-0">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-zinc-100 rounded-full w-3/4"></div>
                  <div className="h-2 bg-zinc-100 rounded-full w-1/2"></div>
                </div>
                <span className="text-zinc-500 font-medium text-sm pr-2">Jarayonda...</span>
              </div>
            )}
          </main>

          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-white via-white to-transparent pb-[70px] pt-24 px-6 flex flex-col items-center gap-4 z-30 pointer-events-none">
            <div className="w-full flex justify-center pointer-events-auto relative z-40">
              {hasItems && state !== 'recording' && state !== 'processing' ? (
                <button
                  onClick={handleSend}
                  disabled={state === 'sending'}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 h-[64px] rounded-full font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:scale-100 group"
                >
                  {state === 'sending' ? (
                    <span className="animate-pulse flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Jo'natilmoqda...
                    </span>
                  ) : (
                    <>
                      <span className="text-lg">Buyurtmani yuborish</span>
                      <Send className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </>
                  )}
                </button>
              ) : (
                <MicButton onStart={handleStartRecord} onStop={handleStopRecord} />
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}