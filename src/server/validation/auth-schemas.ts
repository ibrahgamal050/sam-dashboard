import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a digit')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character')

export const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: passwordSchema,
})

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
})

export const activateSecuritySchema = z.object({
  userId: z.string().min(1),
  checklistCompleted: z.literal(true),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  fingerprint: z.string().optional(),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
})

export const disableAccountSchema = z.object({
  reason: z.string().max(256).optional(),
})
