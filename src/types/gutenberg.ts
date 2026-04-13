export interface GutendexPerson {
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
}

export interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexPerson[];
  summaries: string[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

export interface GutendexSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

export type GutenbergFormatPreference =
  | "auto"
  | "epub"
  | "html"
  | "text"
  | "kindle";

export interface GutenbergBookResult {
  gutenbergId: number;
  title: string;
  author: string | null;
  authors: string[];
  thumbnailUrl: string | null;
  coverUrl: string | null;
  downloadUrl: string;
  mirrorUrl: string;
  landingPageUrl: string;
  mimeType: string;
  languages: string[];
  downloadCount: number;
  summary: string | null;
}

export interface GutenbergSearchResults {
  query: string;
  total: number;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
  results: GutenbergBookResult[];
}
