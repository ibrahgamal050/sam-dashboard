import { z } from "zod"

export const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z
    .array(z.array(z.array(z.number())))
    .refine((rings) => rings.length > 0 && rings.every((ring) => ring.length >= 4), {
      message: "Polygon must have at least one ring with 4 points",
    }),
})

export const createZoneSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  name: z.string().min(2, "name is too short"),
  geometry: polygonSchema,
  fee: z.number().min(0),
  minOrder: z.number().min(0),
  active: z.boolean().default(true),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/)
    .default("#F97316"),
})

export const updateZoneSchema = createZoneSchema
  .partial()
  .extend({
    id: z.string().min(1, "id is required"),
  })

export const checkPointSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})
