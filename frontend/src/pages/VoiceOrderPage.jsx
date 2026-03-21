import React, { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mic, Send } from 'lucide-react';
import MicButton from '../components/MicButton.jsx';
import OrderItem from '../components/OrderItem.jsx';
import CategorySheet from '../components/CategorySheet.jsx';
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
  const {
    state,
    parsedOrder,
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
      toast.success('Muvaffaqiyatli tahlil qilindi ✨');
    },
    onError: (err) => {
      setState('error');
      const message = err?.response?.data?.message ?? 'Xatolik yuz berdi';
      setError(message);
      toast.error(message);
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, updatedOrder }) => {
      // Allow sending updatedOrder body explicitly just in case API parses it
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
      toast.error(message);
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
      // Must hold for 500ms
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
    // For standalone components created locally, send a random UUID, else use original id
    const orderId = parsedOrder.id || parsedOrder.buyurtma_id || crypto.randomUUID();
    await statusMutation.mutateAsync({ id: orderId, status: 'NEW', updatedOrder: parsedOrder });
  };

  const hasItems = parsedOrder && parsedOrder.mahsulotlar && parsedOrder.mahsulotlar.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black flex justify-center items-start sm:items-center w-full">
      <div className="w-full max-w-md bg-white dark:bg-black relative min-h-screen flex flex-col overflow-hidden sm:border-x border-zinc-100 dark:border-zinc-900 shadow-none">
        
        <header className="px-6 pt-12 sm:pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/90 dark:bg-black/90 backdrop-blur-xl z-20 sticky top-0">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Buyurtma</h1>
          <p className="text-sm text-zinc-500 font-medium tracking-wide mt-0.5">Voice-powered order</p>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-[200px] flex flex-col gap-4">
          {!hasItems && state !== 'processing' && state !== 'recording' ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 mt-20 space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 shadow-inner">
                <Mic className="w-16 h-16 text-zinc-300 dark:text-zinc-700 opacity-60" />
              </div>
              <div className="text-center px-8">
                <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200">Hali buyurtmalar yo'q</h2>
                <p className="text-sm mt-2 text-zinc-500 max-w-[200px] mx-auto leading-relaxed">Mikrofonni bosib turing va nimadir buyurtma qiling</p>
              </div>
            </div>
          ) : (
            <>
              {hasItems && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-zinc-400 ml-2 text-xs tracking-widest uppercase">Yangi buyurtma</h3>
                  {parsedOrder.mahsulotlar.map((item, idx) => (
                    <OrderItem key={item.id || item.nomi || idx} item={item} />
                  ))}
                  <div className="mt-2 p-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-2xl flex justify-between items-center shadow-md">
                    <span className="font-medium text-sm text-zinc-400 dark:text-zinc-600">Jami (qoralama)</span>
                    <span className="font-bold text-xl">{parsedOrder.hisob_kitob?.umumiy_summa?.toLocaleString() || 0} so'm</span>
                  </div>
                </div>
              )}
            </>
          )}

          {state === 'processing' && (
            <div className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-4 animate-pulse mt-4">
               <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex justify-center items-center shrink-0">
                 <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
               </div>
               <div className="flex-1 space-y-2">
                 <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-3/4"></div>
                 <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full w-1/2"></div>
               </div>
               <span className="text-zinc-500 font-medium text-sm pr-2">Jarayonda...</span>
            </div>
          )}
        </main>

        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-white via-white to-transparent dark:from-black dark:via-black pb-8 pt-24 px-6 flex flex-col items-center gap-4 z-30 pointer-events-none">
          
          <div className="pointer-events-auto w-full flex justify-center transform -translate-y-2">
            <CategorySheet />
          </div>

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
  );
}