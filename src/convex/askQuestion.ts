"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function findRelevantChunks(
  query: string,
  allChunks: Array<{
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
  }>,
  topK: number = 10,
): Array<{
  documentId: string;
  documentTitle: string;
  chunkText: string;
  chunkIndex: number;
  chunkType?: string;
  pageNumber?: number;
  imageUrl?: string;
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
    chunkType?: string;
    pageNumber?: number;
    imageUrl?: string;
    score: number;
  }> = [];

  for (const doc of allChunks) {
    for (const chunk of doc.chunks) {
      const textLower = chunk.text.toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        const regex = new RegExp(term, "gi");
        const matches = textLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      if (chunk.chunkType === "table") score *= 1.3;
      if (chunk.chunkType === "figure") score *= 1.2;
      if (score > 0) {
        scored.push({
          documentId: doc.documentId,
          documentTitle: doc.documentTitle,
          chunkText: chunk.text,
          chunkIndex: chunk.index,
          chunkType: chunk.chunkType,
          pageNumber: chunk.pageNumber,
          imageUrl: chunk.imageUrl,
          score,
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export const ask = action({
  args: {
    question: v.string(),
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not configured. Set it as an environment variable " +
          "on your Convex deployment to enable answering questions.",
      );
    }

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

    const relevantChunks = findRelevantChunks(args.question, allChunks, 8);

    if (relevantChunks.length === 0) {
      return {
        answer:
          "I couldn't find relevant information in your uploaded documents to answer this question. Try rephrasing or asking about a topic covered in your papers.",
        sources: [],
      };
    }

    const contextParts = relevantChunks.map((chunk, i) => {
      const typeLabel = chunk.chunkType === "table"
        ? "[TABLE]"
        : chunk.chunkType === "figure"
          ? "[FIGURE]"
          : "[TEXT]";
      const pageLabel = chunk.pageNumber ? ` p.${chunk.pageNumber}` : "";
      return `[Source ${i + 1}: "${chunk.documentTitle}" ${typeLabel} (chunk ${chunk.chunkIndex + 1}${pageLabel})]\n${chunk.chunkText}`;
    });

    const context = contextParts.join("\n\n---\n\n");

    const systemPrompt = `You are Thesis Navigator, an academic research assistant. You help graduate students understand and analyze research papers.

The context includes three types of content:
- [TEXT] — regular text excerpts from the paper
- [TABLE] — extracted tables with their data preserved in markdown format
- [FIGURE] — descriptions of figures, charts, and diagrams with their key data points

When answering questions:
- Base your answer ONLY on the provided document excerpts
- Always cite your sources using [Source N] notation
- When referencing a table, mention it is a table and cite the source
- When referencing a figure or chart, describe what it shows and cite the source
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

    const sources = relevantChunks.map((chunk) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documentId: chunk.documentId as any,
      documentTitle: chunk.documentTitle,
      chunkText: chunk.chunkText.slice(0, 400) + (chunk.chunkText.length > 400 ? "..." : ""),
      chunkIndex: chunk.chunkIndex,
      chunkType: chunk.chunkType,
      pageNumber: chunk.pageNumber,
    }));

    return { answer, sources };
  },
});
