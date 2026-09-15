import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getWorkspaceContext } from "./workspace";

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
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    if (args.openAlexId) {
      const candidates = await ctx.db
        .query("papers")
        .withIndex("by_openAlex", (q) =>
          q.eq("openAlexId", args.openAlexId),
        )
        .collect();
      const existing = candidates.find((p) => p.userId === workspaceId);
      if (existing) return existing._id;
    }

    return await ctx.db.insert("papers", {
      userId: workspaceId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

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
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    for (const paperId of [args.sourcePaperId, args.targetPaperId]) {
      const paper = await ctx.db.get(paperId);
      if (!paper || paper.userId !== workspaceId) throw new Error("Not found");
    }

    return await ctx.db.insert("paperLinks", {
      userId: workspaceId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

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
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    for (const entity of args.entities) {
      const candidates = await ctx.db
        .query("entities")
        .withIndex("by_name", (q) => q.eq("name", entity.name))
        .collect();
      const existing = candidates.find((e) => e.userId === workspaceId);

      if (existing) {
        if (!existing.documentIds.includes(args.documentId)) {
          await ctx.db.patch(existing._id, {
            documentIds: [...existing.documentIds, args.documentId],
          });
        }
      } else {
        await ctx.db.insert("entities", {
          userId: workspaceId,
          name: entity.name,
          type: entity.type,
          documentIds: [args.documentId],
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const getPapers = query({
  args: {},
  handler: async (ctx) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) return [];
    return await ctx.db
      .query("papers")
      .withIndex("by_user", (q) => q.eq("userId", workspaceId))
      .collect();
  },
});

export const getLinks = query({
  args: {},
  handler: async (ctx) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) return [];
    return await ctx.db
      .query("paperLinks")
      .withIndex("by_user", (q) => q.eq("userId", workspaceId))
      .collect();
  },
});

export const getEntities = query({
  args: {},
  handler: async (ctx) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) return [];
    return await ctx.db
      .query("entities")
      .withIndex("by_user", (q) => q.eq("userId", workspaceId))
      .collect();
  },
});

export const deletePaper = mutation({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    const paper = await ctx.db.get(args.paperId);
    if (!paper || paper.userId !== workspaceId) throw new Error("Not found");

    const links = await ctx.db
      .query("paperLinks")
      .withIndex("by_user", (q) => q.eq("userId", workspaceId))
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
