import { create } from 'zustand';
import { rmsApi } from '../services/api.js';

const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || '141257b4-b129-4c57-ad75-d3ec74ce93a1';

const baseUrl = import.meta.env.VITE_RMS_API_URL || 'https://uncompulsively-unroasted-nicolette.ngrok-free.dev/api/v1';
const UPLOADS_URL = baseUrl.replace('/api/v1', '');

function transformMenu(apiData) {
  const flatFoods = [];
  const localCategories = [];

  apiData.forEach((cat) => {
    localCategories.push({ id: cat.id, label: cat.name, icon: '🍽️' });
    if (cat.items) {
      cat.items.forEach((item) => {
        flatFoods.push({
          id: item.id,
          nomi: item.name,
          tarkibi: item.description || '',
          kategoriya: cat.name,
          mavjudligi: item.isAvailable,
          narxi: Number(item.price),
          finalPrice: Number(item.finalPrice),
          hasDiscount: item.discount !== null, 
          rasmlar: item.imageUrl ? [UPLOADS_URL + item.imageUrl] : [],
          chegirma: item.discount ? (item.discount.type === 'PERCENTAGE' ? `${item.discount.value}%` : `${item.discount.value} so'm`) : null,
          "o'lchov": "1 porsiya"
        });
      });
    }
  });

  return { flatFoods, localCategories };
}

export const useMenuStore = create((set) => ({
  categories: [],
  flatFoods: [],
  localCategories: [],
  isLoading: false,
  error: null,
  eventSource: null,

  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await rmsApi.get(`/restaurants/${RESTAURANT_ID}/menu`);
      if (data.success) {
        const { flatFoods, localCategories } = transformMenu(data.data);
        set({ categories: data.data, flatFoods, localCategories, isLoading: false });
      } else {
        throw new Error('Menyu formatida xatolik');
      }
    } catch (error) {
      console.error('Menu fetch error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  startMenuStream: () => {
    set((state) => {
      // Don't open multiple connections
      if (state.eventSource) return state;

      const baseUrl = import.meta.env.VITE_RMS_API_URL || 'https://uncompulsively-unroasted-nicolette.ngrok-free.dev/api/v1';
      const eventSource = new EventSource(`${baseUrl}/restaurants/${RESTAURANT_ID}/menu/stream`);

      eventSource.addEventListener('menu:updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          const { flatFoods, localCategories } = transformMenu(data);
          set({ categories: data, flatFoods, localCategories });
        } catch (err) {
          console.error('Failed to parse menu SSE:', err);
        }
      });

      return { eventSource };
    });
  },

  stopMenuStream: () => {
    set((state) => {
      if (state.eventSource) {
        state.eventSource.close();
      }
      return { eventSource: null };
    });
  }
}));
