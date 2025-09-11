import { NextRequest } from 'next/server'
import { subscribeToRestaurant } from '@/lib/orderEvents'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('restaurantId')
  if (!restaurantId) {
    return new Response('Missing restaurantId', { status: 400 })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      function send(data: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      const unsubscribe = subscribeToRestaurant(restaurantId, send)
      // initial hello for connection badge
      send({ event: 'connected', ts: Date.now() })
      ;(req as any).signal?.addEventListener('abort', () => unsubscribe())
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

