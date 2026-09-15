"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAI, unwrapAIError } from "./ai/provider";

export const extractVisualContent = action({
  args: {
    pageImages: v.array(
      v.object({
        pageNumber: v.number(),
        base64: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { client, models } = getAI();
    const results: Array<{
      pageNumber: number;
      chunkType: "table" | "figure";
      text: string;
      imageUrl: string;
    }> = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < args.pageImages.length; i += BATCH_SIZE) {
      const batch = args.pageImages.slice(i, i + BATCH_SIZE);

      const promises = batch.map(async (page) => {
        try {
          const response = await client.chat.completions
            .create({
              model: models.vision,
            messages: [
              {
                role: "system",
                content: `You are an expert at analyzing academic research papers. Your task is to identify and extract tables and figures from a PDF page image.

For TABLES:
- Extract the table content as a well-formatted markdown table
- Include the table caption/title if visible
- Preserve column headers and data accurately

For FIGURES (charts, graphs, diagrams, images):
- Provide a detailed description of what the figure shows
- Include the figure caption/title if visible
- Describe the type of chart/graph, axes labels, key data points, and trends
- Note any notable patterns or findings visible in the figure

If the page contains NO tables or figures, respond with exactly: NO_VISUAL_CONTENT

Otherwise, for each table or figure found, respond in this exact format:
---TABLE---
**Title:** [table caption if visible]
[markdown table content]
---END---

---FIGURE---
**Title:** [figure caption if visible]
**Type:** [bar chart / line graph / scatter plot / diagram / etc.]
**Description:** [detailed description of what the figure shows, including key data points, trends, and findings]
---END---`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/png;base64,${page.base64}`,
                      detail: "low",
                    },
                  },
                  {
                    type: "text",
                    text: `Analyze page ${page.pageNumber} of this research paper. Identify any tables or figures and extract/describe them using the specified format.`,
                  },
                ],
              },
            ],
            max_tokens: 1500,
            temperature: 0.1,
          })
            .catch((err) => unwrapAIError(err));

          const content = response.choices[0]?.message?.content ?? "";

          if (content.includes("NO_VISUAL_CONTENT")) {
            return [];
          }

          const extracted: Array<{
            pageNumber: number;
            chunkType: "table" | "figure";
            text: string;
            imageUrl: string;
          }> = [];

          const tableRegex =
            /---TABLE---\n([\s\S]*?)---END---/g;
          let match;
          while ((match = tableRegex.exec(content)) !== null) {
            extracted.push({
              pageNumber: page.pageNumber,
              chunkType: "table",
              text: match[1].trim(),
              imageUrl: page.base64,
            });
          }

          const figureRegex =
            /---FIGURE---\n([\s\S]*?)---END---/g;
          while ((match = figureRegex.exec(content)) !== null) {
            extracted.push({
              pageNumber: page.pageNumber,
              chunkType: "figure",
              text: match[1].trim(),
              imageUrl: page.base64,
            });
          }

          return extracted;
        } catch (err) {
          console.error(
            `Error processing page ${page.pageNumber}:`,
            err,
          );
          return [];
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.flat());
    }

    return results;
  },
});
