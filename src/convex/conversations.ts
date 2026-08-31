import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** List all conversations for the current user. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** Create a new conversation. */
export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("conversations", {
      userId,
      title: args.title,
      createdAt: Date.now(),
    });
  },
});

/** Delete a conversation and all its messages. */
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv || conv.userId !== userId) throw new Error("Not found");

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

/** Get all messages for a conversation. */
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
  },
});

/** Add a message to a conversation. */
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
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      sources: args.sources,
      createdAt: Date.now(),
    });
  },
});
