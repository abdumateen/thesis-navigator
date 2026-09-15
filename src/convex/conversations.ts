import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getWorkspaceContext } from "./workspace";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) return [];
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", workspaceId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    return await ctx.db.insert("conversations", {
      userId: workspaceId,
      title: args.title,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== workspaceId) throw new Error("Not found");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    await ctx.db.delete(args.conversationId);
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) return [];

    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== workspaceId) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    sources: v.optional(
      v.array(
        v.object({
          documentId: v.id("documents"),
          documentTitle: v.string(),
          chunkText: v.string(),
          chunkIndex: v.number(),
          chunkType: v.optional(
            v.union(v.literal("text"), v.literal("table"), v.literal("figure")),
          ),
          pageNumber: v.optional(v.number()),
          imageUrl: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = await getWorkspaceContext(ctx);
    if (!workspaceId) throw new Error("Not authenticated");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== workspaceId) throw new Error("Not found");

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      sources: args.sources,
      createdAt: Date.now(),
    });
  },
});
