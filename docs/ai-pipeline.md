# AI Pipeline

This document describes exactly how Thesis Navigator uses AI — models, prompts, chunking, retrieval scoring, and how the pieces connect. The goal is that a reader can reproduce or critique every AI-driven behavior from this file alone.

The pipeline has four distinct stages that should not be conflated:

1. **Retrieval** — deterministic, no AI involved.
2. **LLM reasoning** — answering questions strictly from retrieved context.
3. **Structured extraction** — asking models for structured data (tables, entities, references, analyses) and parsing it defensively.
4. **Graph construction** — deterministic storage of extracted facts; no AI involved.

---

## Document ingestion

Ingestion happens **client-side** at upload time (`src/components/PdfUploader.tsx`), so the original PDF file never leaves the browser.

1. **Text extraction** — `pdfjs-dist` extracts per-page text; pages are joined with blank-line separators.
2. **Chunking** — the full text is split into chunks of **1,200 characters with 200 characters of overlap**. Chunks shorter than 50 characters are discarded. Each chunk is stored with `chunkType: "text"`.
3. **Page rasterization** — every page is rendered to a canvas at **1.5× scale** and converted to base64 PNG.
4. **Vision pass** — page images are sent to `gpt-4o-mini` (vision) in **batches of 5 pages** (`src/convex/processDocument.ts`). For each page the model either responds `NO_VISUAL_CONTENT` or emits fenced blocks:
   - `---TABLE---` blocks containing a markdown transcription of the table (caption, headers, and rows preserved),
   - `---FIGURE---` blocks with the caption, chart type, description, and notable patterns.

   These blocks are recovered with regular expressions (`---TABLE---\n([\s\S]*?)---END---` etc.). A page that yields nothing is simply skipped. All chunks — text, tables, figures — are stored in one `documents.create` mutation, tagged with `chunkType` and `pageNumber`.

**Failure modes:** if the vision call fails (network, rate limit, missing key), the upload continues in text-only mode and the user is warned with a toast. If no text at all can be extracted (scanned/image-only PDF), the upload is rejected with an explanatory message.

---

## Retrieval (no AI)

`src/convex/askQuestion.ts` — `findRelevantChunks`:

- The question is lowercased and split on whitespace; terms shorter than 3 characters are dropped.
- For every chunk in the user's selected documents, the score is the **total number of occurrences** of each question term in the chunk text (case-insensitive regex).
- Type boosts: table chunks ×**1.3**, figure chunks ×**1.2** — a soft nudge because these chunks are rare and usually high-information, not because tables are inherently more relevant.
- The top **8** chunks across all selected documents become the context.

There are **no embeddings yet** — this is plain term-frequency scoring, which works well for technical vocabulary but misses paraphrases. Semantic retrieval is on the [roadmap](../README.md#roadmap).

## Question answering (LLM reasoning)

Same file, `ask` action:

- Model: **`gpt-4o`**, temperature **0.3**, max tokens **2,000**.
- Context is assembled as numbered blocks:

  ```
  [Source 1: "Paper title" [TABLE] (chunk 14, p.6)]
  <chunk text>
  ---
  [Source 2: …]
  ```

- The system prompt instructs the model to answer **only** from the provided excerpts, cite with `[Source N]`, treat `[TABLE]` and `[FIGURE]` blocks as such, and say so clearly when the context is insufficient.
- The answer text is returned to the client together with a `sources` array (document ID, title, chunk excerpt up to 400 characters, chunk index, type, page). The UI renders each source as an expandable card, so every `[Source N]` in the answer is verifiable.

---

## Reference extraction → citation network

`src/convex/extractReferences.ts`:

1. **Where to look:** the last **30%** of the document text (references live at the end); the final 6,000 characters of that window are sent.
2. **Model:** `gpt-4o-mini`, temperature 0.1, asked to return **only** a JSON array of reference *titles* (max 30 kept).
3. **Parsing:** the first `\[[\s\S]*\]` block is extracted and passed to `JSON.parse`; any string items survive, everything else is discarded. A parse failure returns an empty list.
4. **Metadata resolution:** each title is searched against the **OpenAlex** API (`searchByTitle` in `openalex.ts`, best-match, 100 ms delay between requests as a courtesy pause). The first hit provides authors (up to 5), publication year, citation count, DOI, and an abstract reconstructed from OpenAlex's inverted-index format.
5. **Storage:** each resolved reference is upserted into `papers` (deduplicated by `openAlexId`), and a `cites` link is written from the source paper to the reference.

Resolved metadata is what sizes and decorates the citation-network nodes — citation counts come from OpenAlex, not from any model.

## Entity extraction → knowledge graph

`src/convex/extractEntities.ts`:

- **Input:** the first 30% of the text (abstract + introduction) concatenated with the following 30% (methods + results), capped at **8,000 characters**.
- **Model:** `gpt-4o-mini`, temperature 0.1, asked for JSON of the shape `{ methods, datasets, metrics, concepts }`, each an array of 3–8 canonical names (e.g. "BERT", "ImageNet", "F1-score").
- **Parsing:** same defensive pattern — first `{...}` block, `JSON.parse`, per-field `Array.isArray` checks, structured fallback `{ methods: [], … }` on failure.
- **Storage** (`citationGraph.saveEntities`): entities are **deduplicated by exact name** across the whole library. An entity stores its type and the list of document IDs that mention it. Papers sharing an entity get a `shared_concept` link in the graph view.

## Novelty assessment (per paper)

`src/convex/researchAnalysis.ts` — `analyzeNovelty`:

- **Input:** the first 25% plus the last 20% of the text (contributions and conclusions live at the edges), capped at **10,000 characters**.
- **Model:** `gpt-4o`, temperature 0.2, returning JSON with `summary`, `novelContributions[]` (each with `contribution`, `significance`, `noveltyLevel` of high/moderate/incremental), `methodology` (approach, strengths, limitations), and `positionInField` (buildsOn, differentiatesFrom, openQuestions).

## Research gap analysis (cross-paper)

Same file — `analyzeGaps`:

- **Input:** for each paper, the first 15% + last 15% of text (title-heading + intro and conclusion), capped at 3,000 characters each; the combined overview is capped at **25,000 characters** total.
- **Model:** `gpt-4o`, temperature 0.3. The prompt explicitly forbids inventing papers not in the collection and requires evidence references to actual provided titles.
- **Output:** `landscape` (2–3 sentence overview), `gaps[]` (topic, description, evidence, potentialImpact, suggestedQuestions), `contestedAreas[]`, `methodologyGaps[]`, `futureDirections[]`.
- Requires **≥ 2 papers** in the library; the UI disables the action below that threshold.

---

## Cost and latency notes

- Vision extraction is the expensive step: one `gpt-4o-mini` vision call per page, with `detail: "low"` images. Typical papers cost a few cents to process; pages with no tables/figures are detected but still cost one call each.
- Q&A sends at most 8 chunks (~10k characters) per question.
- Gap analysis and novelty assessment are on-demand (button-triggered), not automatic.

## Known limitations

- Retrieval is lexical — paraphrases and synonyms are not matched (roadmap: embeddings).
- Entity deduplication is exact-string; "BERT" and "bert-base" are distinct nodes.
- Reference extraction depends on the model reading the tail of the document; references formatted unusually may be missed, and OpenAlex title search occasionally resolves to the wrong work for very generic titles.
- LLM outputs are parsed with regex + `JSON.parse`; the structured fallbacks mean a malformed response yields an empty report rather than an error, but also silently drops content.
