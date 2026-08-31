import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Thesis Navigator: uploaded research papers
    documents: defineTable({
      userId: v.string(),
      title: v.string(),
      filename: v.string(),
      fullText: v.string(),
      chunkCount: v.number(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // Thesis Navigator: text chunks extracted from documents
    chunks: defineTable({
      documentId: v.id("documents"),
      text: v.string(),
      index: v.number(),
      chunkType: v.optional(
        v.union(v.literal("text"), v.literal("table"), v.literal("figure")),
      ),
      pageNumber: v.optional(v.number()),
      imageUrl: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_document", ["documentId"]),

    // Thesis Navigator: chat conversations
    conversations: defineTable({
      userId: v.string(),
      title: v.string(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // Thesis Navigator: chat messages with source citations
    messages: defineTable({
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
      createdAt: v.number(),
    }).index("by_conversation", ["conversationId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
