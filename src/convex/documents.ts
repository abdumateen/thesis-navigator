import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** List all documents for the current user. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** Create a new document and its text chunks. Called from the frontend after
 *  PDF text extraction with pdf.js. */
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
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    const docId = await ctx.db.insert("documents", {
      userId,
      title: args.title,
      filename: args.filename,
      fullText: args.fullText,
      chunkCount: args.chunks.length,
      createdAt: Date.now(),
    });

    // Insert chunks
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

/** Delete a document and all its chunks. */
export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) throw new Error("Not found");

    // Delete all chunks for this document
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

/** Get all chunks for a set of document IDs. Used by askQuestion to gather
 *  context for the LLM. */
export const getChunks = query({
  args: { documentIds: v.array(v.id("documents")) },
  handler: async (ctx, args) => {
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
      if (!doc) continue;
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
