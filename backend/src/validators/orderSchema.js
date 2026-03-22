import { z } from 'zod';

const asNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

export const orderItemAddonSchema = z.object({
  nomi: z.string().min(1),
  narxi: z.preprocess(asNumber, z.number().nonnegative())
});

const normalizeStatus = (value) => {
  if (value == null) return 'yangi';
  if (typeof value !== 'string') return 'yangi';
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return 'yangi';
  if (['pishirilyapti', 'pishirilmoqda', 'tayyorlanmoqda', 'cooking', 'in_progress'].includes(cleaned)) {
    return 'pishirilmoqda';
  }
  if (['tayyor', 'ready', 'done', 'tayyor!'].includes(cleaned)) {
    return 'tayyor';
  }
  if (['yangi', 'new', 'pending', 'mavjud', 'yangi!', 'buyurildi'].includes(cleaned)) {
    return 'yangi';
  }
  // unknown — default to yangi (never crash)
  return 'yangi';
};

export const orderItemSchema = z.object({
  nomi: z.string().min(1),
  miqdor: z.preprocess(asNumber, z.number().int().positive()),
  tavsif: z.string().default(''),
  qoshimchalar: z.array(orderItemAddonSchema).default([]),
  status: z.preprocess(normalizeStatus, z.enum(['pishirilmoqda', 'tayyor', 'yangi']).default('yangi')),
  birlik_narxi: z.preprocess(asNumber, z.number().nonnegative().optional()).optional().default(0),
  jami_narxi: z.preprocess(asNumber, z.number().nonnegative()),
  ombor_qoldig_i: z.enum(['yetarli', 'kam']).optional().default('yetarli')
});

export const hisobKitobSchema = z.object({
  sub_total: z.preprocess(asNumber, z.number().nonnegative()),
  xizmat_haqi_foiz: z.preprocess(asNumber, z.number().nonnegative()),
  xizmat_haqi_summa: z.preprocess(asNumber, z.number().nonnegative()),
  umumiy_summa: z.preprocess(asNumber, z.number().nonnegative())
});

export const parsedOrderSchema = z.object({
  buyurtma_id: z.string().min(1),
  stol: z.preprocess(asNumber, z.number().int().positive()),
  mijoz: z.string().default("Noma'lum"),
  ofitsiant_id: z.preprocess(asNumber, z.number().int().positive().optional()).optional().default(1),
  vaqt: z.string().default(() => new Date().toISOString()),
  mahsulotlar: z.array(orderItemSchema).min(1),
  hisob_kitob: hisobKitobSchema,
  taxminiy_tolov_turi: z.string().default('naqd'),
  ogohlantirish: z.string().nullable().optional()
});
