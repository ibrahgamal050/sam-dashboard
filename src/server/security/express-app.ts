import express from 'express'
import cookieParser from 'cookie-parser'
import { helmetMiddleware } from './helmet'
import { corsMiddleware } from './cors'
import { apiRateLimiter } from './rate-limit'
import { csrfMiddleware, attachCsrfHeader } from './csrf'

export function createSecureExpressApp() {
  const app = express()

  app.disable('x-powered-by')

  app.use(helmetMiddleware)
  app.use(corsMiddleware)
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(apiRateLimiter)
  app.use(csrfMiddleware)
  app.use((req, res, next) => {
    attachCsrfHeader(res)
    next()
  })

  return app
}
