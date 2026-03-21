import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    logger.error({ error }, 'Orders fetch failed');
    return res.status(500).json({ message: 'Buyurtmalar yuklanmadi' });
  }
  return res.json({ orders: data ?? [] });
});

const statusSchema = z.object({
  status: z.enum(['NEW', 'COOKING', 'READY', 'COMPLETED'])
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const id = req.params.id;

    const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;

    const result = await supabase
      .from('orders')
      .update({ status, completed_at: completedAt })
      .eq('id', id)
      .select('*')
      .single();

    if (result.error || !result.data) {
      logger.error({ error: result.error }, 'Status update failed');
      return res.status(500).json({ message: 'Status yangilanmadi' });
    }

    return res.json({ order: result.data });
  } catch (error) {
    logger.error({ error }, 'Invalid status update');
    return res.status(422).json({ message: "Noto'g'ri status" });
  }
});

let channelInitialized = false;
let channel = null;
const clients = new Set();

function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(data);
  }
}

async function initChannel() {
  if (channelInitialized) return;
  channelInitialized = true;

  channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        broadcast({ type: 'orders_change', payload });
      }
    )
    .subscribe((status) => {
      logger.info({ status }, 'Supabase realtime status');
    });
}

router.get('/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  clients.add(res);
  await initChannel();

  req.on('close', () => {
    clients.delete(res);
  });
});

export default router;
