# Thesis Navigator

An AI research assistant for graduate students. Upload your papers, ask
questions about them, and map the research landscape around them.

## Features

- **PDF Q&A with citations** — extract text from uploaded papers and ask
  questions against them; every answer cites the exact chunk it came from.
- **Tables and figures** — pages are analyzed visually so tables (as markdown)
  and figures (as descriptions) are searchable alongside regular text.
- **Citation network** — references are resolved against OpenAlex and rendered
  as an interactive, draggable graph.
- **Knowledge graph** — methods, datasets, and metrics are extracted from each
  paper and linked across the whole library.
- **Research gap analysis** — novelty assessment per paper and cross-library
  synthesis of what is missing, contested, or unresolved.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4, shadcn/ui
- Convex (backend, database, auth)
- OpenAI API (GPT-4o, GPT-4o-mini Vision)
- OpenAlex (paper metadata)
- vis-network (graph rendering)

## Setup

```bash
bun install
bun dev
```

Environment variables:

| Variable | Where | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Convex backend | Q&A, vision extraction, entity and gap analysis |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Convex backend | Google sign-in |

The Convex deployment, site URL, and auth keys are provisioned by the hosting
environment.
