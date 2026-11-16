import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  recipes: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id('_storage')),
    servings: v.optional(v.number()),
    prepMinutes: v.optional(v.number()),
    cookMinutes: v.optional(v.number()),
    ingredients: v.array(v.string()),
    steps: v.array(v.string()),
    tags: v.array(v.string()),
    notes: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    favorite: v.boolean(),
    searchText: v.string(),
    updatedAt: v.number(),
  })
    .index('by_user_updated', ['userId', 'updatedAt'])
    .index('by_image', ['imageId'])
    .searchIndex('search_text', { searchField: 'searchText', filterFields: ['userId'] }),
})
