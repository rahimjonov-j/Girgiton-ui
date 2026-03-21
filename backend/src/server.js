import './env.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import voiceOrderRouter from './routes/voiceOrder.js';
import ordersRouter from './routes/orders.js';
import { logger } from './utils/logger.js';

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim());

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked'));
    },
    credentials: false
  })
);

app.use(express.json({ limit: '12mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/voice-order', voiceOrderRouter);
app.use('/orders', ordersRouter);

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Server xatoligi' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  logger.info(`Backend listening on port ${port}`);
});
