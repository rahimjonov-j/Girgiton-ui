import { create } from 'zustand';

export const useOrderStore = create((set) => ({
  state: 'idle',
  transcription: '',
  parsedOrder: null,
  storedOrder: null,
  error: null,
  setState: (state) => set({ state }),
  setTranscription: (text) => set({ transcription: text }),
  setParsedOrder: (order) => set({ parsedOrder: order }),
  setStoredOrder: (order) => set({ storedOrder: order }),
  setError: (message) => set({ error: message }),
  
  addItem: (item) => set((state) => {
    let order = state.parsedOrder;
    if (!order) {
      order = {
        stol: "1",
        buyurtma_id: crypto.randomUUID().slice(0, 8),
        mahsulotlar: [],
        hisob_kitob: { umumiy_summa: 0, soliq: 0, jami_tolov: 0 }
      };
    }
    const newItems = [...order.mahsulotlar];
    
    const existingIndex = newItems.findIndex(i => i.nomi === item.name);
    if (existingIndex >= 0) {
      newItems[existingIndex].miqdor += 1;
      newItems[existingIndex].jami_narxi = newItems[existingIndex].miqdor * item.price;
    } else {
      newItems.push({
        id: crypto.randomUUID(),
        nomi: item.name,
        miqdor: 1,
        jami_narxi: item.price,
        unit_price: item.price,
        tavsif: "",
        qoshimchalar: []
      });
    }

    const newTotal = newItems.reduce((acc, curr) => acc + curr.jami_narxi, 0);
    return { 
      parsedOrder: { 
        ...order, 
        mahsulotlar: newItems,
        hisob_kitob: { ...order.hisob_kitob, umumiy_summa: newTotal }
      } 
    };
  }),

  updateItemName: (id, name) => set((state) => {
    if (!state.parsedOrder) return state;
    const newItems = state.parsedOrder.mahsulotlar.map(item => 
      item.id === id || item.nomi === id ? { ...item, nomi: name } : item
    );
    return { parsedOrder: { ...state.parsedOrder, mahsulotlar: newItems } };
  }),

  updateItemQty: (id, delta) => set((state) => {
    if (!state.parsedOrder) return state;
    const newItems = state.parsedOrder.mahsulotlar.map(item => {
      if (item.id === id || item.nomi === id) {
        const unitPrice = item.unit_price || item.jami_narxi / item.miqdor;
        const newQty = Math.max(1, item.miqdor + delta);
        return { ...item, miqdor: newQty, jami_narxi: newQty * unitPrice, unit_price: unitPrice };
      }
      return item;
    });
    const newTotal = newItems.reduce((acc, curr) => acc + curr.jami_narxi, 0);
    return { 
      parsedOrder: { 
        ...state.parsedOrder, 
        mahsulotlar: newItems,
        hisob_kitob: { ...state.parsedOrder.hisob_kitob, umumiy_summa: newTotal }
      } 
    };
  }),

  removeItem: (id) => set((state) => {
    if (!state.parsedOrder) return state;
    const newItems = state.parsedOrder.mahsulotlar.filter(item => item.id !== id && item.nomi !== id);
    const newTotal = newItems.reduce((acc, curr) => acc + curr.jami_narxi, 0);
    
    const newOrder = newItems.length === 0 ? null : { 
      ...state.parsedOrder, 
      mahsulotlar: newItems,
      hisob_kitob: { ...state.parsedOrder.hisob_kitob, umumiy_summa: newTotal }
    };
    
    return { parsedOrder: newOrder };
  }),

  reset: () =>
    set({
      state: 'idle',
      transcription: '',
      parsedOrder: null,
      storedOrder: null,
      error: null
    })
}));
