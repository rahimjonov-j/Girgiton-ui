import { Router } from 'express';
import { z } from 'zod';
import { speechToText } from '../services/speechToText.js';
import { parseOrderWithOpenAI } from '../services/openaiParser.js';
import { parsedOrderSchema } from '../validators/orderSchema.js';
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

    const openAiResult = await parseOrderWithOpenAI(transcription);

    if (openAiResult === 'Mavzudan chiqildi') {
      return res.status(422).json({ message: 'Buyurtma mavzuga mos emas' });
    }

    const parsed = parsedOrderSchema.parse(openAiResult);
    return res.json({ order: parsed, transcription });
  } catch (error) {
    if (error?.statusCode === 429 || error?.message === 'OPENAI_RATE_LIMIT') {
      return res.status(429).json({ message: 'OpenAI limitiga yetildi. Birozdan keyin qayta urinib koring.' });
    }
    if (error?.message === 'OPENAI_JSON_INVALID') {
      return res.status(422).json({ message: "Buyurtma JSON noto'g'ri formatda" });
    }
    if (error?.message === 'OPENAI_INVALID_REQUEST') {
      return res.status(400).json({ message: `OpenAI xatosi: ${error.details || 'Model yoki API kalitida masala.'}` });
    }
    logger.error({ error: error?.message ?? error }, 'Voice order error');
    if (error?.issues) {
      if (process.env.NODE_ENV !== 'production') {
        return res.status(422).json({ message: "Buyurtma JSON noto'g'ri formatda", issues: error.issues });
      }
      return res.status(422).json({ message: "Buyurtma JSON noto'g'ri formatda" });
    }
    return res.status(500).json({ message: error?.message || 'Server xatoligi' });
  }
});

export default router;
