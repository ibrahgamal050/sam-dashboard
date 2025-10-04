interface RouteParamsPromise {
  params: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Resolves route params from Next.js 15 handlers where params arrive as a Promise.
 */
export async function getRouteParams<T extends Record<string, unknown>>(
  context: RouteParamsPromise
): Promise<Partial<T>> {
  const resolved = (await context.params) || {}
  return resolved as Partial<T>
}

export type RouteHandlerContext = RouteParamsPromise
