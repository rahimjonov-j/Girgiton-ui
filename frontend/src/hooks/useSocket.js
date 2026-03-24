import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore.js';
import { toast } from 'sonner';

export function useSocket() {
  const { sessionToken } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!sessionToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_RMS_SOCKET_URL || 'https://uncompulsively-unroasted-nicolette.ngrok-free.dev/orders';
    
    const socket = io(socketUrl, {
      query: { sessionToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to RMS WebSocket');
    });

    socket.on('order:status_changed', (order) => {
      if (order.status === 'READY') {
        const tableNumber = order.table?.tableNumber || '?';
        toast.success(`${tableNumber}-stol buyurtmasi TAYYOR bo'ldi! 🔔`, { duration: 8000 });
      } else if (order.status === 'CANCELLED') {
        const tableNumber = order.table?.tableNumber || '?';
        toast.error(`${tableNumber}-stol buyurtmasi bekor qilindi.`, { duration: 6000 });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from RMS WebSocket');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [sessionToken]);

  return socketRef.current;
}
