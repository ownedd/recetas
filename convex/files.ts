import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireUserId } from './lib/auth'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Borra un archivo subido que no quedó asociado a ninguna receta
 * (por ejemplo, porque el guardado falló). Nunca borra fotos en uso.
 */
export const discardUpload = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    await requireUserId(ctx)
    const inUse = await ctx.db
      .query('recipes')
      .withIndex('by_image', (q) => q.eq('imageId', storageId))
      .first()
    if (!inUse && (await ctx.db.system.get(storageId))) await ctx.storage.delete(storageId)
    return null
  },
})
