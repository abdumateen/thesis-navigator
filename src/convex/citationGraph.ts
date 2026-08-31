import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** Save a fetched paper and return its ID. */
export const savePaper = mutation({
  args: {
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    citationCount: v.optional(v.number()),
    abstract: v.optional(v.string()),
    openAlexId: v.optional(v.string()),
    doi: v.optional(v.string()),
    sourceDocumentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    // Check if paper already exists
    if (args.openAlexId) {
      const existing = await ctx.db
        .query("papers")
        .withIndex("by_openAlex", (q) =>
          q.eq("openAlexId", args.openAlexId),
        )
        .first();
      if (existing) return existing._id;
    }

    return await ctx.db.insert("papers", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

/** Create a citation link between two papers. */
export const saveLink = mutation({
  args: {
    sourcePaperId: v.id("papers"),
    targetPaperId: v.id("papers"),
    relationship: v.union(
      v.literal("cites"),
      v.literal("shared_concept"),
    ),
    concept: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("paperLinks", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

/** Save extracted entities for a document. */
export const saveEntities = mutation({
  args: {
    documentId: v.id("documents"),
    entities: v.array(
      v.object({
        name: v.string(),
        type: v.union(
          v.literal("method"),
          v.literal("dataset"),
          v.literal("metric"),
          v.literal("concept"),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    for (const entity of args.entities) {
      // Check if entity already exists
      const existing = await ctx.db
        .query("entities")
        .withIndex("by_name", (q) => q.eq("name", entity.name))
        .first();

      if (existing) {
        // Add this document to the entity's document list if not already there
        if (!existing.documentIds.includes(args.documentId)) {
          await ctx.db.patch(existing._id, {
            documentIds: [...existing.documentIds, args.documentId],
          });
        }
      } else {
        await ctx.db.insert("entities", {
          userId,
          name: entity.name,
          type: entity.type,
          documentIds: [args.documentId],
          createdAt: Date.now(),
        });
      }
    }
  },
});

/** Get all papers for the current user. */
export const getPapers = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];
    return await ctx.db
      .query("papers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Get all citation links for the current user. */
export const getLinks = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];
    return await ctx.db
      .query("paperLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Get all entities for the current user. */
export const getEntities = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];
    return await ctx.db
      .query("entities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Delete a paper and all its links. */
export const deletePaper = mutation({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    const paper = await ctx.db.get(args.paperId);
    if (!paper || paper.userId !== userId) throw new Error("Not found");

    // Delete all links involving this paper
    const links = await ctx.db
      .query("paperLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const link of links) {
      if (
        link.sourcePaperId === args.paperId ||
        link.targetPaperId === args.paperId
      ) {
        await ctx.db.delete(link._id);
      }
    }

    await ctx.db.delete(args.paperId);
  },
});
