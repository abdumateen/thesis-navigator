# Screenshots

This folder holds the images used in the README [Product Tour](../../README.md#product-tour).

Expected files:

| File | Screen |
| --- | --- |
| `dashboard.png` | Research workspace with the library grid |
| `qa.png` | Paper Q&A with expandable source cards |
| `paper-viewer.png` | Document detail with extracted chunks |
| `citation-network.png` | Citation network graph view |
| `knowledge-graph.png` | Knowledge graph view |
| `research-gaps.png` | Gap analysis report |

## Capturing real screenshots

The images currently referenced by the README are **illustrative placeholders, not captures of the running app** — they should be replaced with real screenshots.

1. Run the app locally (`npx convex dev` + `bun dev`, see the [README](../../README.md#local-development)).
2. Sign in, upload a couple of open-access papers, and let the graph processing finish.
3. Capture each screen at a consistent size (2× scale, ≥ 1440 px wide works well on GitHub) with your OS screenshot tool or a browser extension like GoFullPage.
4. Optionally frame them consistently (e.g. [shots.so](https://shots.so) or a plain browser-window crop) — keep it subtle; the UI should speak for itself.
5. Save with the exact filenames above (PNG, ideally under ~500 KB each) and commit.

A screenshot is only worth shipping if it shows the real product. Do not edit screenshots to add data that the app did not actually produce.
