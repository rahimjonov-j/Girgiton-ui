import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const router = Router();

// In-memory mock data array for the routes so the app doesn't crash
const mockOrdersDb = [];

router.get('/', async (_req, res) => {
  return res.json({ orders: mockOrdersDb });
});

const generateOrderId = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

router.post('/', async (req, res) => {
  try {
    const { mahsulotlar, stol, mijoz, hisob_kitob, taxminiy_tolov_turi } = req.body;
    if (!mahsulotlar || !Array.isArray(mahsulotlar) || mahsulotlar.length === 0) {
      return res.status(400).json({ message: 'Mahsulotlar ro\'yxati bo\'sh' });
    }

    const payload = {
      buyurtma_id: generateOrderId(),
      stol: stol || 1,
      mijoz: mijoz || 'Noma\'lum',
      ofitsiant_id: 1,
      vaqt: new Date().toISOString(),
      mahsulotlar,
      hisob_kitob: hisob_kitob || {
        sub_total: mahsulotlar.reduce((a, i) => a + (i.jami_narxi || 0), 0),
        xizmat_haqi_foiz: 15,
        xizmat_haqi_summa: 0,
        umumiy_summa: mahsulotlar.reduce((a, i) => a + (i.jami_narxi || 0), 0)
      },
      taxminiy_tolov_turi: taxminiy_tolov_turi || 'naqd',
      status: 'NEW'
    };

    // Supabase removed - save to in-memory array for now
    const mockOrder = { id: payload.buyurtma_id, ...payload };
    mockOrdersDb.unshift(mockOrder);

    broadcast({ type: 'orders_change', payload: { type: 'INSERT', new: mockOrder } });

    logger.info({ orderId: mockOrder.id }, 'Manual order saved (Mock)');
    return res.status(201).json({ order: mockOrder });
  } catch (err) {
    logger.error({ error: err?.message }, 'POST /orders error');
    return res.status(500).json({ message: err?.message || 'Server xatoligi' });
  }
});


const statusSchema = z.object({
  status: z.enum(['NEW', 'COOKING', 'READY', 'COMPLETED'])
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const id = req.params.id;

    const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;

    const orderIndex = mockOrdersDb.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Topilmadi' });
    }

    mockOrdersDb[orderIndex] = { ...mockOrdersDb[orderIndex], status, completed_at: completedAt };
    broadcast({ type: 'orders_change', payload: { type: 'UPDATE', new: mockOrdersDb[orderIndex] } });

    return res.json({ order: mockOrdersDb[orderIndex] });
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
  logger.info('Realtime events initialized (Mock Mode)');
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
