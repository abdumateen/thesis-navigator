import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

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
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),

      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    documents: defineTable({
      userId: v.string(),
      title: v.string(),
      filename: v.string(),
      fullText: v.string(),
      chunkCount: v.number(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

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

    conversations: defineTable({
      userId: v.string(),
      title: v.string(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    papers: defineTable({
      userId: v.string(),
      sourceDocumentId: v.optional(v.id("documents")),
      title: v.string(),
      authors: v.optional(v.string()),
      year: v.optional(v.number()),
      citationCount: v.optional(v.number()),
      abstract: v.optional(v.string()),
      openAlexId: v.optional(v.string()),
      doi: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"])
      .index("by_openAlex", ["openAlexId"]),

    paperLinks: defineTable({
      userId: v.string(),
      sourcePaperId: v.id("papers"),
      targetPaperId: v.id("papers"),
      relationship: v.union(
        v.literal("cites"),
        v.literal("shared_concept"),
      ),
      concept: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"])
      .index("by_source", ["sourcePaperId"]),

    entities: defineTable({
      userId: v.string(),
      name: v.string(),
      type: v.union(
        v.literal("method"),
        v.literal("dataset"),
        v.literal("metric"),
        v.literal("concept"),
      ),
      documentIds: v.array(v.id("documents")),
      createdAt: v.number(),
    }).index("by_user", ["userId"])
      .index("by_name", ["name"]),

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
