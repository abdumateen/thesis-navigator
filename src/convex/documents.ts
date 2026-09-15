import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getWorkspaceContext } from "./workspace";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) return [];
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", workspaceId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    filename: v.string(),
    fullText: v.string(),
    chunks: v.array(
      v.object({
        text: v.string(),
        chunkType: v.optional(
          v.union(v.literal("text"), v.literal("table"), v.literal("figure")),
        ),
        pageNumber: v.optional(v.number()),
        imageUrl: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    const docId = await ctx.db.insert("documents", {
      userId: workspaceId,
      title: args.title,
      filename: args.filename,
      fullText: args.fullText,
      chunkCount: args.chunks.length,
      createdAt: Date.now(),
    });

    for (let i = 0; i < args.chunks.length; i++) {
      const chunk = args.chunks[i];
      await ctx.db.insert("chunks", {
        documentId: docId,
        text: chunk.text,
        index: i,
        chunkType: chunk.chunkType,
        pageNumber: chunk.pageNumber,
        imageUrl: chunk.imageUrl,
        createdAt: Date.now(),
      });
    }

    return docId;
  },
});

export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== workspaceId) throw new Error("Not found");

    const chunks = await ctx.db
      .query("chunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    await ctx.db.delete(args.documentId);
  },
});

export const getChunks = query({
  args: { documentIds: v.array(v.id("documents")) },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) return [];

    const results: Array<{
      documentId: string;
      documentTitle: string;
      documentFilename: string;
      chunks: Array<{
        text: string;
        index: number;
        chunkType?: string;
        pageNumber?: number;
        imageUrl?: string;
      }>;
    }> = [];

    for (const docId of args.documentIds) {
      const doc = await ctx.db.get(docId);
      if (!doc || doc.userId !== workspaceId) continue;
      const chunks = await ctx.db
        .query("chunks")
        .withIndex("by_document", (q) => q.eq("documentId", docId))
        .collect();
    results.push({
      documentId: docId,
      documentTitle: doc.title,
      documentFilename: doc.filename,
      chunks: chunks.map((c) => ({
        text: c.text,
        index: c.index,
        chunkType: c.chunkType,
        pageNumber: c.pageNumber,
        imageUrl: c.imageUrl,
      })),
    });
    }

    return results;
  },
});
