import axios from 'axios';
import { getBackendUrl } from './backendUrl.js';

const baseURL = getBackendUrl();

const api = axios.create({
  baseURL,
  timeout: 30000
});

export default api;
