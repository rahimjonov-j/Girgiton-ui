import React, { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, AlertCircle, Plus } from 'lucide-react';
import MicButton from '../components/MicButton.jsx';
import OrderItem from '../components/OrderItem.jsx';
import MenuPanel from '../components/MenuPanel.jsx';
import { useRecorder } from '../hooks/useRecorder.js';
import api, { rmsApi } from '../services/api.js';
import { useOrderStore } from '../store/useOrderStore.js';
import { useTableStore } from '../store/useTableStore.js';
import { useMenuStore } from '../store/useMenuStore.js';
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
  const { fetchTables } = useTableStore();

  React.useEffect(() => {
    fetchTables();
  }, [fetchTables]);

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

  const [transcriptionText, setTranscriptionText] = useState('');

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

    setState('sending');

    try {
      const { tables } = useTableStore.getState();
      const targetTableNumber = Number(parsedOrder.stol) || 1;
      const table = tables.find(t => t.tableNumber === targetTableNumber);

      if (!table) {
        throw new Error(`${targetTableNumber}-stol tizimda topilmadi`);
      }

      const MENU_ITEMS = useMenuStore.getState().flatFoods;
      const rmsItems = [];

      for (const item of parsedOrder.mahsulotlar) {
        const found = MENU_ITEMS.find(i => 
          i.id === item.id || 
          (i.nomi || '').toLowerCase().trim() === (item.nomi || '').toLowerCase().trim()
        );
        
        if (!found) {
          throw new Error(`"${item.nomi}" menyudan topilmadi`);
        }

        rmsItems.push({
          menuItemId: found.id,
          quantity: item.miqdor || 1
        });
      }

      const payload = {
        tableId: table.id,
        items: rmsItems,
        note: parsedOrder.ogohlantirish || ""
      };

      await rmsApi.post('/orders', payload);

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
      const message = err?.response?.data?.message || err.message || 'Xatolik yuz berdi';
      setError(message);
      setState('preview');
    }
  };

  const hasItems = parsedOrder && parsedOrder.mahsulotlar && parsedOrder.mahsulotlar.length > 0;

  return (
    <>
      <MenuPanel isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div
        className="h-dvh bg-white flex justify-center items-start sm:items-center w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full max-w-md bg-white relative h-full flex flex-col overflow-hidden sm:border-x border-zinc-100 shadow-none">

          {/* Top fixed Jami section */}
          {hasItems && (
            <div className="absolute top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm">
              <div className="px-5 py-3 bg-green-50 text-green-900 flex flex-col gap-1.5 w-full">
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium text-sm text-green-700">Xizmat haqi (10%)</span>
                  <span className="font-semibold text-[15px]">{parsedOrder.hisob_kitob?.xizmat_haqi_summa?.toLocaleString() || 0} so'm</span>
                </div>
                <div className="h-px bg-green-200/60 w-full my-0.5"></div>
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-base text-green-800">Umumiy hisob</span>
                  <span className="font-bold text-xl">{parsedOrder.hisob_kitob?.umumiy_summa?.toLocaleString() || 0} so'm</span>
                </div>
              </div>
            </div>
          )}

          <main className={`flex-1 overflow-y-auto scrollbar-hide px-4 ${hasItems ? 'pt-[110px]' : 'pt-12'} pb-[160px] flex flex-col gap-4`}>

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
                {/* Centered Add Button 15px below orders */}
                <div className="flex justify-center mt-[15px]">
                  <button
                    onClick={() => setMenuOpen(true)}
                    aria-label="Mahsulot qo'shish"
                    className="flex justify-center items-center w-[52px] h-[52px] bg-[#1bac4b] text-white rounded-full shadow-[0_4px_14px_rgba(27,172,75,0.3)] hover:bg-emerald-600 active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-7 h-7 stroke-[2.5]" />
                  </button>
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

          {hasItems && state !== 'recording' && state !== 'processing' ? (
            <div className="absolute bottom-0 left-0 right-0 z-50">
              <button
                onClick={handleSend}
                disabled={state === 'sending'}
                className="w-full h-[60px] bg-[#1bac4b] text-white flex items-center justify-center text-[17px] font-bold active:brightness-90 transition-all disabled:opacity-70 group"
              >
                {state === 'sending' ? (
                  <span className="animate-pulse flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Jo'natilmoqda...
                  </span>
                ) : (
                  <>
                    <span>Buyurtmani yuborish</span>
                    <Send className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-white via-white to-transparent pb-[70px] pt-24 px-6 flex flex-col items-center gap-4 z-30 pointer-events-none">
              <div className="w-full flex justify-center pointer-events-auto relative z-40">
                <MicButton onStart={handleStartRecord} onStop={handleStopRecord} />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}