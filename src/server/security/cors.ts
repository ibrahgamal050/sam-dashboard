import cors from 'cors'
import { env } from '../env'

const defaultOrigin = ['http://localhost:3000']

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.allowedOrigins.length ? env.allowedOrigins : defaultOrigin

    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('CORS not allowed for this origin'))
  },
  credentials: true,
  optionsSuccessStatus: 204,
})
