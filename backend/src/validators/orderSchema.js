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
  if (typeof value !== 'string') return value;
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return value;
  if (['pishirilyapti', 'pishirilmoqda', 'tayyorlanmoqda', 'cooking', 'in_progress'].includes(cleaned)) {
    return 'pishirilmoqda';
  }
  if (['tayyor', 'ready', 'done', 'tayyor!'].includes(cleaned)) {
    return 'tayyor';
  }
  if (['yangi', 'new', 'pending'].includes(cleaned)) {
    return 'yangi';
  }
  return cleaned;
};

export const orderItemSchema = z.object({
  nomi: z.string().min(1),
  miqdor: z.preprocess(asNumber, z.number().int().positive()),
  tavsif: z.string().default(''),
  qoshimchalar: z.array(orderItemAddonSchema).default([]),
  status: z.preprocess(normalizeStatus, z.enum(['pishirilmoqda', 'tayyor', 'yangi']).default('pishirilmoqda')),
  birlik_narxi: z.preprocess(asNumber, z.number().nonnegative()),
  jami_narxi: z.preprocess(asNumber, z.number().nonnegative()),
  ombor_qoldig_i: z.enum(['yetarli', 'kam']).default('yetarli')
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
  mijoz: z.string().min(1),
  ofitsiant_id: z.preprocess(asNumber, z.number().int().positive()),
  vaqt: z.string().min(1),
  mahsulotlar: z.array(orderItemSchema).min(1),
  hisob_kitob: hisobKitobSchema,
  taxminiy_tolov_turi: z.string().min(1),
  ogohlantirish: z.string().nullable().optional()
});
