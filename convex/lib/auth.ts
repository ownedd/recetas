import { ConvexError } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'

/** Devuelve el identificador del usuario autenticado o lanza "No autenticado". */
export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError('No autenticado')
  return identity.tokenIdentifier
}
