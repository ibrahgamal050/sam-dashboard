import type { AppRouteHandlerFnContext } from 'next/dist/server/route-modules/app-route/module'

/**
 * Resolves route params from Next.js 15 handlers where params arrive as a Promise.
 */
export async function getRouteParams<T extends Record<string, unknown>>(
  context: AppRouteHandlerFnContext
): Promise<Partial<T>> {
  return (context.params ? await context.params : {}) as Partial<T>
}

export type RouteHandlerContext = AppRouteHandlerFnContext
