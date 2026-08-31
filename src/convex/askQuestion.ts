"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Simple TF-IDF-like keyword scoring to find the most relevant chunks.
 * Returns the top N chunks ranked by relevance to the query.
 */
function findRelevantChunks(
  query: string,
  allChunks: Array<{
    documentId: string;
    documentTitle: string;
    documentFilename: string;
    chunks: Array<{ text: string; index: number }>;
  }>,
  topK: number = 8,
): Array<{
  documentId: string;
  documentTitle: string;
  chunkText: string;
  chunkIndex: number;
  score: number;
}> {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored: Array<{
    documentId: string;
    documentTitle: string;
    chunkText: string;
    chunkIndex: number;
    score: number;
  }> = [];

  for (const doc of allChunks) {
    for (const chunk of doc.chunks) {
      const textLower = chunk.text.toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        // Count occurrences of each query term
        const regex = new RegExp(term, "gi");
        const matches = textLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      if (score > 0) {
        scored.push({
          documentId: doc.documentId,
          documentTitle: doc.documentTitle,
          chunkText: chunk.text,
          chunkIndex: chunk.index,
          score,
        });
      }
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/** Ask a question about the uploaded documents. Uses simple keyword retrieval
 *  to find relevant chunks, then sends them to OpenAI GPT-4o for a cited answer. */
export const ask = action({
  args: {
    question: v.string(),
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key not configured. Please add OPENAI_API_KEY in your project's Keys/API keys settings.",
      );
    }

    // Fetch all chunks for the selected documents
    const { api } = await import("./_generated/api.js");
    const allChunks = await ctx.runQuery(api.documents.getChunks, {
      documentIds: args.documentIds,
    });

    if (!allChunks || allChunks.length === 0) {
      return {
        answer:
          "No documents have been uploaded yet. Please upload some research papers first.",
        sources: [],
      };
    }

    // Find the most relevant chunks using keyword scoring
    const relevantChunks = findRelevantChunks(args.question, allChunks, 8);

    if (relevantChunks.length === 0) {
      return {
        answer:
          "I couldn't find relevant information in your uploaded documents to answer this question. Try rephrasing or asking about a topic covered in your papers.",
        sources: [],
      };
    }

    // Build context for the LLM
    const contextParts = relevantChunks.map((chunk, i) => {
      return `[Source ${i + 1}: "${chunk.documentTitle}" (chunk ${chunk.chunkIndex + 1})]\n${chunk.chunkText}`;
    });

    const context = contextParts.join("\n\n---\n\n");

    const systemPrompt = `You are Thesis Navigator, an academic research assistant. You help graduate students understand and analyze research papers.

When answering questions:
- Base your answer ONLY on the provided document excerpts
- Always cite your sources using [Source N] notation
- If the provided context doesn't contain enough information to fully answer, say so clearly
- Use precise academic language
- Structure your answers clearly with headers when appropriate
- Highlight key findings, methodologies, and limitations when relevant`;

    const userMessage = `Based on the following research paper excerpts, please answer this question. Cite your sources using [Source N] notation.

Question: ${args.question}

---
${context}
---`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const answer = response.choices[0]?.message?.content ?? "No response generated.";

    // Build source references
    const sources = relevantChunks.map((chunk) => ({
      documentId: chunk.documentId as any,
      documentTitle: chunk.documentTitle,
      chunkText: chunk.chunkText.slice(0, 300) + (chunk.chunkText.length > 300 ? "..." : ""),
      chunkIndex: chunk.chunkIndex,
    }));

    return { answer, sources };
  },
});
