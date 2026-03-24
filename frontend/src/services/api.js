import axios from 'axios';
import { getBackendUrl } from './backendUrl.js';
import { useAuthStore } from '../store/useAuthStore.js';

const baseURL = getBackendUrl();
const rmsBaseURL = import.meta.env.VITE_RMS_API_URL || 'https://uncompulsively-unroasted-nicolette.ngrok-free.dev/api/v1';

// Used for local Node server (AI Voice parse)
const api = axios.create({
  baseURL,
  timeout: 120000
});

// Used for all Rayhon RMS operations
export const rmsApi = axios.create({
  baseURL: rmsBaseURL,
  timeout: 60000
});

// Intercept requests to attach sessionToken
rmsApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().sessionToken;
  if (token) {
    config.headers['x-session-token'] = token;
  }
  return config;
});

// Intercept responses to handle 401/403 token expiration
rmsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
