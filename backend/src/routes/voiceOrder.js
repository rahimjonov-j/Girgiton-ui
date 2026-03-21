import { Router } from 'express';
import { z } from 'zod';
import { speechToText } from '../services/speechToText.js';
import { parseOrderWithGemini } from '../services/geminiParser.js';
import { parsedOrderSchema } from '../validators/orderSchema.js';
import { supabase } from '../services/supabase.js';
import { logger } from '../utils/logger.js';

const router = Router();

const requestSchema = z.object({
  audioBase64: z.string().optional(),
  mimeType: z.string().optional(),
  text: z.string().optional(),
  updateOrderId: z.string().uuid().optional()
});

const generateOrderId = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

router.post('/', async (req, res) => {
  try {
    const { audioBase64, mimeType, text, updateOrderId } = requestSchema.parse(req.body);

    if (!audioBase64 && !text) {
      logger.warn({ hasBody: Boolean(req.body), contentType: req.headers['content-type'] }, 'Empty voice order payload');
      return res.status(400).json({ message: 'Audio yoki matn kerak' });
    }

    const transcription = text ?? (await speechToText(audioBase64, mimeType ?? 'audio/ogg'));

    if (!transcription.trim()) {
      return res.status(400).json({ message: "Bo'sh buyurtma matni" });
    }

    const geminiResult = await parseOrderWithGemini(transcription);

    if (geminiResult === 'Mavzudan chiqildi') {
      return res.status(422).json({ message: 'Buyurtma mavzuga mos emas' });
    }

    const parsed = parsedOrderSchema.parse(geminiResult);
    const normalizedOrderId = /^ORD-\d{4}$/.test(parsed.buyurtma_id) ? parsed.buyurtma_id : generateOrderId();

    if (!parsed.stol) {
      return res.status(422).json({ message: 'Stol raqami topilmadi' });
    }

    const payload = {
      buyurtma_id: normalizedOrderId,
      stol: parsed.stol,
      mijoz: parsed.mijoz,
      ofitsiant_id: parsed.ofitsiant_id,
      vaqt: parsed.vaqt,
      mahsulotlar: parsed.mahsulotlar,
      hisob_kitob: parsed.hisob_kitob,
      taxminiy_tolov_turi: parsed.taxminiy_tolov_turi,
      status: 'NEW'
    };

    let result;
    if (updateOrderId) {
      result = await supabase
        .from('orders')
        .update(payload)
        .eq('id', updateOrderId)
        .select('*')
        .single();
    } else {
      result = await supabase.from('orders').insert(payload).select('*').single();
    }

    if (result.error || !result.data) {
      logger.error({ error: result.error }, 'Supabase write failed');
      return res.status(500).json({ message: 'Buyurtma saqlanmadi' });
    }

    logger.info({ orderId: result.data.id }, 'Order saved');

    return res.json({ order: result.data, transcription });
  } catch (error) {
    if (error?.statusCode === 429 || error?.message === 'GEMINI_RATE_LIMIT') {
      return res.status(429).json({ message: 'Gemini limitiga yetildi. Birozdan keyin qayta urinib koring.' });
    }
    if (error?.message === 'GEMINI_JSON_INVALID') {
      return res.status(422).json({ message: "Buyurtma JSON noto'g'ri formatda" });
    }
    if (error?.message === 'GEMINI_INVALID_REQUEST') {
      return res.status(400).json({ message: "Gemini sozlamalari noto'g'ri. Model yoki API kalitini tekshiring." });
    }
    logger.error({ error: error?.message ?? error }, 'Voice order error');
    if (error?.issues) {
      if (process.env.NODE_ENV !== 'production') {
        return res.status(422).json({ message: "Buyurtma JSON noto'g'ri formatda", issues: error.issues });
      }
      return res.status(422).json({ message: "Buyurtma JSON noto'g'ri formatda" });
    }
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: error?.message ?? 'Server xatoligi' });
    }
    return res.status(500).json({ message: 'Server xatoligi' });
  }
});

export default router;
