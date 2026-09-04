"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const extractEntities = action({
  args: {
    fullText: v.string(),
  },
  handler: async (_ctx, args) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured.");
    }

    const openai = getOpenAI();

    const intro = args.fullText.slice(0, Math.floor(args.fullText.length * 0.3));
    const methods = args.fullText.slice(
      Math.floor(args.fullText.length * 0.3),
      Math.floor(args.fullText.length * 0.6),
    );
    const sample = `${intro}\n\n${methods}`.slice(0, 8000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Extract key research entities from the paper text. Return ONLY a JSON object with this structure:
{
  "methods": ["name of method/algorithm/technique", ...],
  "datasets": ["name of dataset/benchmark", ...],
  "metrics": ["name of metric/measure", ...],
  "concepts": ["key concept/theory/framework", ...]
}

Rules:
- Each array should contain 3-8 items
- Use the canonical/official name (e.g., "BERT", "ImageNet", "F1-score")
- Only include entities explicitly mentioned in the text
- If a category has no entities, use an empty array
- Do not include any text before or after the JSON`,
        },
        {
          role: "user",
          content: `Extract research entities from this paper text:\n\n${sample}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content ?? "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { methods: [], datasets: [], metrics: [], concepts: [] };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        methods: Array.isArray(parsed.methods) ? parsed.methods : [],
        datasets: Array.isArray(parsed.datasets) ? parsed.datasets : [],
        metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
      };
    } catch {
      return { methods: [], datasets: [], metrics: [], concepts: [] };
    }
  },
});
