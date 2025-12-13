import { z } from "zod"

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const openingIntervalSchema = z.object({
  start: z.string().regex(timeRegex, "Invalid time HH:mm"),
  end: z.string().regex(timeRegex, "Invalid time HH:mm"),
}).refine(v => v.start !== v.end, "Start and end must differ")

const daySchema = z.object({
  open: z.boolean().default(true),
  intervals: z.array(openingIntervalSchema).max(4).default([]),
})

export const openingHoursSchema = z.object({
  mon: daySchema, tue: daySchema, wed: daySchema, thu: daySchema,
  fri: daySchema, sat: daySchema, sun: daySchema,
})

export const createBranchSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  address: z.object({
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    location: z.object({
      type: z.literal("Point").default("Point"),
      coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
    }).optional(),
  }),
  openingHours: openingHoursSchema,
  isMain: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const updateBranchSchema = createBranchSchema.partial()
