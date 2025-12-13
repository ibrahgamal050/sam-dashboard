import * as z from 'zod'

export const StatusEnum = z.enum([
  'pending',
  'queued',
  'in_progress',
  'ready',
  'served',
  'canceled',
  'completed',
  'rejected',
  'paid',
])
export type StatusEnum = z.infer<typeof StatusEnum>

export const PaymentStatusEnum = z.enum(['unpaid', 'paid', 'partially_paid', 'refunded', 'failed'])
export type PaymentStatusEnum = z.infer<typeof PaymentStatusEnum>

export const PaymentMethodEnum = z.enum(['cash', 'card', 'online', 'wallet', 'voucher', 'bank_transfer', 'mixed'])
export type PaymentMethodEnum = z.infer<typeof PaymentMethodEnum>

const PaymentPatchSchema = z
  .object({
    status: PaymentStatusEnum.optional(),
    method: PaymentMethodEnum.optional(),
  })
  .partial()

export type PaymentPatch = z.infer<typeof PaymentPatchSchema>

export const PatchOneSchema = z
  .object({
    status: StatusEnum.optional(),
    payment: PaymentPatchSchema.optional(),
    paymentStatus: PaymentStatusEnum.optional(),
    paymentMethod: PaymentMethodEnum.optional(),
  })
  .refine((d) => {
    const hasStatus = d.status !== undefined
    const hasPaymentBlock = Boolean(d.payment && (d.payment.status !== undefined || d.payment.method !== undefined))
    const hasLegacyPayment = d.paymentStatus !== undefined || d.paymentMethod !== undefined
    return hasStatus || hasPaymentBlock || hasLegacyPayment
  }, { message: 'No changes provided' })

export const BulkPatchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  changes: PatchOneSchema,
})
