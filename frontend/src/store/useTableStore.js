import { create } from 'zustand';
import { rmsApi } from '../services/api.js';

const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || '141257b4-b129-4c57-ad75-d3ec74ce93a1';

export const useTableStore = create((set) => ({
  tables: [],
  isLoading: false,
  error: null,

  fetchTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await rmsApi.get(`/restaurants/${RESTAURANT_ID}/tables`);
      const tablesArray = Array.isArray(data) ? data : (data?.data || []);
      set({ tables: tablesArray, isLoading: false });
    } catch (error) {
      console.error('Tables fetch error:', error);
      set({ error: error.message, isLoading: false });
    }
  }
}));
