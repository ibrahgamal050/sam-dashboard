import next from 'next'
import { createSecureExpressApp } from './express-app'

const dev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT ?? 3000)

async function bootstrap() {
  const nextApp = next({ dev, port })
  const handle = nextApp.getRequestHandler()
  await nextApp.prepare()

  const app = createSecureExpressApp()

  app.all('*', (req, res) => {
    return handle(req, res)
  })

  const server = app.listen(port, () => {
    console.log(`Secure Next server running on http://localhost:${port}`)
  })

  const shutdown = () => {
    console.log('Shutting down secure server...')
    server.close(() => process.exit(0))
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

bootstrap().catch((error) => {
  console.error('Failed to start secure dev server', error)
  process.exit(1)
})
