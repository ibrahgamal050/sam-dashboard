import type { IUser } from '@/models/User'

export const mapUserToSafe = (user: IUser) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  roles: user.roles,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt,
  securityProfile: {
    hardeningComplete: user.securityProfile.hardeningComplete,
    lastPasswordChangeAt: user.securityProfile.lastPasswordChangeAt,
  },
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})
