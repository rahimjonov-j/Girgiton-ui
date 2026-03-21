import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  logger.error('Supabase credentials missing');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

try {
  const host = new URL(supabaseUrl).host;
  logger.info({ host, keyLength: supabaseServiceRoleKey.length }, 'Supabase config loaded');
} catch {
  logger.warn('Supabase URL parse failed');
}

if (!globalThis.WebSocket) {
  // @ts-expect-error - assign WS for supabase realtime
  globalThis.WebSocket = WebSocket;
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } }
});
