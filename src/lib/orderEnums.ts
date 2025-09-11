import * as z from 'zod'

export const StatusEnum = z.enum(['pending','queued','in_progress','ready','served','canceled'])
export type StatusEnum = z.infer<typeof StatusEnum>

export const PaymentStatusEnum = z.enum(['unpaid','paid','partially_paid','refunded'])
export type PaymentStatusEnum = z.infer<typeof PaymentStatusEnum>

export const PaymentMethodEnum = z.enum(['cash','card','online','wallet','voucher','bank_transfer','mixed'])
export type PaymentMethodEnum = z.infer<typeof PaymentMethodEnum>

export const PatchOneSchema = z.object({
  status: StatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  paymentMethod: PaymentMethodEnum.optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'No changes provided' })

export const BulkPatchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  changes: PatchOneSchema,
})

