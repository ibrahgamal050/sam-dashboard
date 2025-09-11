import { NextRequest } from 'next/server'
import { subscribeKitchen } from '@/lib/kitchenEvents'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('restaurantId')
  const station = searchParams.get('station')
  if (!restaurantId || !station) {
    return new Response('restaurantId and station required', { status: 400 })
  }
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder()
      function send(data: any) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      const off = subscribeKitchen(restaurantId, station, send)
      send({ event: 'connected', ts: Date.now() })
      ;(req as any).signal?.addEventListener('abort', () => off())
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

