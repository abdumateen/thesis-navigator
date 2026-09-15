# Contributing to Thesis Navigator

Thank you for considering a contribution. This document covers what you need to know to get a development environment running and get a pull request merged.

## Development setup

Prerequisites: [Bun](https://bun.sh) 1.1+, Node.js 18+ (for the Convex CLI), and Git.

```bash
git clone https://github.com/abdumateen/thesis-navigator.git
cd thesis-navigator
bun install
cp .env.example .env.local   # fill in VITE_CONVEX_URL after the next step
npx convex dev               # terminal 1: creates/links a project, generates codegen
bun dev                      # terminal 2: starts Vite
```

Backend environment variables (`SITE_URL`, `OPENAI_API_KEY`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `EMAIL_API_URL`, `EMAIL_API_KEY`) are set on the Convex deployment with `npx convex env set KEY value` — never committed. Most UI and retrieval work needs no keys at all; only Q&A, vision extraction, and the analysis features require `OPENAI_API_KEY`, and only sign-in flows need the auth variables.

## Branch strategy

- `main` is stable: it should always build and deploy.
- Create feature branches from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<topic>`.
- Keep branches focused — one feature or fix per pull request.

## Code style

- TypeScript strict mode; avoid `any` (there are two narrowly-scoped `eslint-disable` exceptions for the pdf.js render call and vis-network typings — don't add more without discussion).
- Run `bun run lint` and `bun run build` before pushing; both must pass.
- Formatting follows the Prettier defaults (`{}` config — anything goes through Prettier cleanly).
- React conventions used in this repo:
  - hooks only at the top level of components/hooks;
  - Convex queries are subscriptions — don't mirror query results into local state unless deriving or editing;
  - prefer the existing shadcn/ui components in `src/components/ui/` over adding dependencies.

## Backend changes (Convex)

- Functions live in `src/convex/`; the schema in `schema.ts` is the source of truth for tables and indexes.
- Every query/mutation must scope reads and writes by the authenticated user.
- LLM responses are parsed defensively: extract the JSON block, `JSON.parse`, validate each field, and fall back to a structured empty result. A malformed model response should never throw into the UI.
- After changing anything under `src/convex/`, run `bunx convex dev --once` and commit only the source files — `src/convex/_generated/` is gitignored and regenerated locally.

## Pull requests

1. Open an issue first for anything substantial (new feature, schema change, new dependency) so it can be discussed before you build it.
2. Write a clear PR description: what changed, why, and how to test it.
3. Include screenshots or short screen recordings for UI changes.
4. Keep the diff minimal — no drive-by reformatting of unrelated files.

## Issues

- Bug reports: include steps to reproduce, expected vs. actual behavior, browser/OS, and any console output (**redact API keys and personal data**).
- Feature proposals: describe the research workflow you are trying to accomplish, not just the feature.
- Good first issues are labeled [`good first issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## Testing expectations

The project currently has **no automated test suite**. Until one exists:

- Manually verify the affected flows (upload → chunks, Q&A with sources, graph processing, gap analysis).
- `bun run build` (which typechecks) and `bun run lint` must pass on every PR.
- If you add a feature with meaningful logic (retrieval scoring, chunking, parsing), consider adding tests with your PR — `bun test` with `bun:test` works out of the box and would be a very welcome contribution.
