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

export const orderItemSchema = z.object({
  nomi: z.string().min(1),
  miqdor: z.preprocess(asNumber, z.number().int().positive().default(1)),
  birlik: z.string().default('ta'),

  // Accept these from AI but strip them from output
  tavsif: z.string().optional(),
  narx: z.number().optional(),
  jami: z.number().optional(),
  status: z.string().optional(),
  ombor_qoldig_i: z.string().optional(),
  birlik_narxi: z.number().optional(),
  jami_narxi: z.number().optional(),
  unit_price: z.number().optional(),
}).transform(({ nomi, miqdor, birlik }) => ({ nomi, miqdor, birlik }));

export const parsedOrderSchema = z.object({
  stol: z.preprocess(asNumber, z.number().int().nonnegative()),
  mahsulotlar: z.array(orderItemSchema).min(1),

  // Accept these from AI but strip from output
  jami_summa: z.number().optional(),
  offitsiant_haqqi: z.number().optional(),
  yakuniy_summa: z.number().optional(),
  buyurtma_id: z.string().optional(),
  ofitsiant_id: z.preprocess(asNumber, z.number().int().positive().optional()).optional(),
  vaqt: z.string().optional(),
  ogohlantirish: z.string().nullable().optional(),
  hisob_kitob: z.any().optional(),
}).transform(({ stol, mahsulotlar, ofitsiant_id, ogohlantirish }) => ({
  stol,
  mahsulotlar,
  ...(ofitsiant_id ? { ofitsiant_id } : {}),
  ...(ogohlantirish ? { ogohlantirish } : {}),
}));
