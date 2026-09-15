"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAI, unwrapAIError } from "./ai/provider";
import { searchByTitle } from "./openalex";

async function extractReferenceStrings(fullText: string): Promise<string[]> {
  const { client, models } = getAI();

  const refSection = fullText.slice(Math.floor(fullText.length * 0.7));

  const response = await client.chat.completions
    .create({
      model: models.extraction,
      messages: [
        {
          role: "system",
          content: `Extract all academic references/citations from the text. Return ONLY a JSON array of reference title strings (the title portion of each citation). Example:
["Deep Residual Learning for Image Recognition", "Attention Is All You Need", "BERT: Pre-training of Deep Bidirectional Transformers"]

If no references are found, return an empty array: []
Do not include any text before or after the JSON array.`,
        },
        {
          role: "user",
          content: `Extract reference titles from this section of an academic paper:\n\n${refSection.slice(-6000)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })
    .catch((err) => unwrapAIError(err));

  const content = response.choices[0]?.message?.content ?? "[]";

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const refs = JSON.parse(jsonMatch[0]);
    return Array.isArray(refs)
      ? refs.filter((r: unknown) => typeof r === "string").slice(0, 30)
      : [];
  } catch {
    return [];
  }
}

export const processDocumentReferences = action({
  args: {
    documentId: v.id("documents"),
    fullText: v.string(),
  },
  handler: async (ctx, args) => {
    const referenceTitles = await extractReferenceStrings(args.fullText);

    if (referenceTitles.length === 0) {
      return { papers: [], links: [] };
    }

    const papers: Array<{
      title: string;
      authors: string;
      year: number | null;
      citationCount: number;
      abstract: string;
      openAlexId: string;
      doi: string | null;
    }> = [];

    for (const title of referenceTitles) {
      try {
        const metadata = await searchByTitle(title);
        if (metadata) {
          papers.push(metadata);
        }
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error(`Failed to look up "${title}":`, err);
      }
    }

    return {
      papers: papers.slice(0, 20),
      links: [],
    };
  },
});
