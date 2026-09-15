"use node";

const BASE_URL = "https://api.openalex.org";
const MAILTO = "thesis-navigator@open-source.app";

export interface OpenAlexWork {
  id: string;
  title: string | null;
  display_name: string | null;
  authorships: Array<{
    author: { display_name: string };
  }>;
  publication_year: number | null;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  doi: string | null;
  ids: {
    openalex: string;
    doi: string | null;
  };
}

export interface PaperMetadata {
  openAlexId: string;
  title: string;
  authors: string;
  year: number | null;
  citationCount: number;
  abstract: string;
  doi: string | null;
}

function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null,
): string {
  if (!invertedIndex) return "";
  const wordPositions: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordPositions.push([pos, word]);
    }
  }
  wordPositions.sort((a, b) => a[0] - b[0]);
  return wordPositions.map(([, word]) => word).join(" ");
}

export async function searchByTitle(
  title: string,
): Promise<PaperMetadata | null> {
  const cleanTitle = title.replace(/[^\w\s]/g, " ").trim();
  const url = `${BASE_URL}/works?search=${encodeURIComponent(cleanTitle)}&per_page=1&mailto=${MAILTO}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const work: OpenAlexWork | undefined = data.results?.[0];
  if (!work || !work.title) return null;

  return {
    openAlexId: work.ids.openalex,
    title: work.title,
    authors: work.authorships
      .slice(0, 5)
      .map((a) => a.author.display_name)
      .join(", "),
    year: work.publication_year,
    citationCount: work.cited_by_count,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    doi: work.doi,
  };
}

export async function getById(
  openAlexId: string,
): Promise<PaperMetadata | null> {
  const shortId = openAlexId.replace("https://openalex.org/", "");
  const url = `${BASE_URL}/works/${shortId}?mailto=${MAILTO}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const work: OpenAlexWork = await res.json();
  if (!work.title) return null;

  return {
    openAlexId: work.ids.openalex,
    title: work.title,
    authors: work.authorships
      .slice(0, 5)
      .map((a) => a.author.display_name)
      .join(", "),
    year: work.publication_year,
    citationCount: work.cited_by_count,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    doi: work.doi,
  };
}

export async function getByIds(
  ids: string[],
): Promise<PaperMetadata[]> {
  if (ids.length === 0) return [];
  const shortIds = ids.map((id) =>
    id.replace("https://openalex.org/", ""),
  );
  const filter = shortIds.join("|");
  const url = `${BASE_URL}/works?filter=openalex:${filter}&per_page=${ids.length}&mailto=${MAILTO}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || [])
    .filter((w: OpenAlexWork) => w.title)
    .map((w: OpenAlexWork) => ({
      openAlexId: w.ids.openalex,
      title: w.title!,
      authors: w.authorships
        .slice(0, 5)
        .map((a) => a.author.display_name)
        .join(", "),
      year: w.publication_year,
      citationCount: w.cited_by_count,
      abstract: reconstructAbstract(w.abstract_inverted_index),
      doi: w.doi,
    }));
}
