import bcrypt from 'bcryptjs'
import { env } from '../env'

export const hashPassword = async (password: string) => {
  const rounds = env.bcryptSaltRounds
  return bcrypt.hash(password, rounds)
}

export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash)
