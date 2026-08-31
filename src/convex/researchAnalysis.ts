"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/** Analyze a single paper and identify its novel contributions. */
export const analyzeNovelty = action({
  args: {
    fullText: v.string(),
    title: v.string(),
  },
  handler: async (_ctx, args) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured.");
    }

    const openai = getOpenAI();

    // Send abstract + intro + conclusion (where novelty is usually stated)
    const intro = args.fullText.slice(0, Math.floor(args.fullText.length * 0.25));
    const conclusion = args.fullText.slice(Math.floor(args.fullText.length * 0.8));
    const sample = `${intro}\n\n${conclusion}`.slice(0, 10000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert academic research analyst. Analyze the paper and identify its novel contributions.

Return ONLY a JSON object with this structure:
{
  "summary": "One-paragraph summary of the paper's core contribution",
  "novelContributions": [
    {
      "contribution": "description of the novel contribution",
      "significance": "why this matters to the field",
      "noveltyLevel": "high" | "moderate" | "incremental"
    }
  ],
  "methodology": {
    "approach": "brief description of the research approach",
    "strengths": ["strength of the methodology"],
    "limitations": ["limitation or weakness"]
  },
  "positionInField": {
    "buildsOn": ["what existing work this builds on"],
    "differentiatesFrom": ["how this differs from prior work"],
    "openQuestions": ["questions this paper leaves unanswered"]
  }
}

Rules:
- Be specific and precise, referencing the actual content of the paper
- NoveltyLevel should be: "high" (first-of-its-kind), "moderate" (significant extension), or "incremental" (small improvement)
- Keep each array item concise (1-2 sentences)
- Do not include any text before or after the JSON`,
        },
        {
          role: "user",
          content: `Analyze the novelty and contributions of "${args.title}":\n\n${sample}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        summary: "Could not analyze this paper.",
        novelContributions: [],
        methodology: { approach: "", strengths: [], limitations: [] },
        positionInField: { buildsOn: [], differentiatesFrom: [], openQuestions: [] },
      };
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {
        summary: "Could not parse analysis results.",
        novelContributions: [],
        methodology: { approach: "", strengths: [], limitations: [] },
        positionInField: { buildsOn: [], differentiatesFrom: [], openQuestions: [] },
      };
    }
  },
});

/** Analyze a collection of papers and identify research gaps. */
export const analyzeGaps = action({
  args: {
    papers: v.array(
      v.object({
        title: v.string(),
        fullText: v.string(),
      }),
    ),
  },
  handler: async (_ctx, args) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured.");
    }

    if (args.papers.length === 0) {
      throw new Error("No papers provided for analysis.");
    }

    const openai = getOpenAI();

    // Build a concise overview of each paper (title + first 15% + last 10%)
    const paperSummaries = args.papers.map((paper) => {
      const intro = paper.fullText.slice(0, Math.floor(paper.fullText.length * 0.15));
      const conclusion = paper.fullText.slice(Math.floor(paper.fullText.length * 0.85));
      return `### ${paper.title}\n${intro}\n\n${conclusion}`.slice(0, 3000);
    });

    // Limit total context to avoid token limits
    const totalContext = paperSummaries.join("\n\n---\n\n").slice(0, 25000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert academic research analyst specializing in identifying research gaps and opportunities.

Analyze the collection of papers provided and identify what is missing, contested, or unresolved in this research area.

Return ONLY a JSON object with this structure:
{
  "landscape": "A 2-3 sentence overview of the current state of this research area based on the papers provided",
  "gaps": [
    {
      "topic": "short title for this gap",
      "description": "detailed description of what is missing or understudied",
      "evidence": "which papers or lack of papers supports this gap identification",
      "potentialImpact": "high" | "medium" | "low",
      "suggestedQuestions": ["specific research question that could address this gap"]
    }
  ],
  "contestedAreas": [
    {
      "topic": "what is being debated",
      "description": "summary of the different positions",
      "papers": ["which papers take which positions"]
    }
  ],
  "methodologyGaps": [
    {
      "gap": "what methodological improvement is needed",
      "description": "why current methods are insufficient"
    }
  ],
  "futureDirections": [
    {
      "direction": "promising future research direction",
      "rationale": "why this direction is promising",
      "prerequisites": ["what would be needed to pursue this"]
    }
  ]
}

Rules:
- Base your analysis ONLY on the papers provided — do not invent papers that aren't there
- Be specific: reference actual papers by title when making claims
- Research gaps should represent genuine opportunities, not just minor omissions
- Include 3-6 gaps, 1-3 contested areas, 1-3 methodology gaps, and 2-4 future directions
- Suggested questions should be specific, actionable, and researchable
- Do not include any text before or after the JSON`,
        },
        {
          role: "user",
          content: `Analyze the following ${args.papers.length} papers and identify research gaps, contested areas, and future opportunities:\n\n${totalContext}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        landscape: "Could not analyze the research landscape.",
        gaps: [],
        contestedAreas: [],
        methodologyGaps: [],
        futureDirections: [],
      };
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {
        landscape: "Could not parse analysis results.",
        gaps: [],
        contestedAreas: [],
        methodologyGaps: [],
        futureDirections: [],
      };
    }
  },
});
