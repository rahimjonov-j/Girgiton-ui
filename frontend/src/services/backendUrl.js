export const getBackendUrl = () => {
  const raw = import.meta.env.VITE_BACKEND_URL;
  if (raw && typeof raw === 'string') {
    return raw.replace(/\/+$/, '');
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }

  console.error('VITE_BACKEND_URL is missing. Please set it in Vercel.');
  return '';
};
