import bcrypt from 'bcryptjs'

const parseSaltRounds = () => {
  const parsed = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '', 10)
  return Number.isFinite(parsed) ? parsed : 12
}

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, parseSaltRounds())
}

export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash)
