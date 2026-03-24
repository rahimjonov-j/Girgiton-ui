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
  tavsif: z.string().default(''),
  
  // AI prompt pricing fields
  narx: z.number().optional().default(0),
  jami: z.number().optional().default(0),

  // Defaults for legacy compatibility
  qoshimchalar: z.array(z.any()).default([]),
  status: z.string().default('yangi'),
  ombor_qoldig_i: z.string().default('yetarli')
}).transform((val) => ({
  ...val,
  birlik_narxi: val.narx || 0,
  jami_narxi: val.jami || 0,
  unit_price: val.narx || 0
}));

export const parsedOrderSchema = z.object({
  stol: z.preprocess(asNumber, z.number().int().nonnegative()),
  mahsulotlar: z.array(orderItemSchema).min(1),

  // AI prompt total fields
  jami_summa: z.number().optional().default(0),
  offitsiant_haqqi: z.number().optional().default(0),
  yakuniy_summa: z.number().optional().default(0),

  // Fallback defaults for legacy frontend/DB compatibility
  buyurtma_id: z.string().optional().default(''),
  mijoz: z.string().default("Noma'lum"),
  ofitsiant_id: z.preprocess(asNumber, z.number().int().positive().optional()).optional().default(1),
  vaqt: z.string().default(() => new Date().toISOString()),
  taxminiy_tolov_turi: z.string().default('naqd'),
  ogohlantirish: z.string().nullable().optional()
}).transform((val) => ({
  ...val,
  hisob_kitob: {
    sub_total: val.jami_summa || 0,
    xizmat_haqi_foiz: 10,
    xizmat_haqi_summa: val.offitsiant_haqqi || 0,
    umumiy_summa: val.yakuniy_summa || 0
  }
}));
