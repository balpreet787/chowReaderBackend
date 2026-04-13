import { logDebug } from "../utils/debug";
import {
  GutendexBook,
  GutendexSearchResponse,
  GutenbergBookResult,
  GutenbergFormatPreference,
  GutenbergSearchResults,
} from "../types/gutenberg";

const GUTENDEX_BASE_URL = "https://gutendex.com";
const GUTENBERG_LANDING_PAGE_BASE_URL = "https://www.gutenberg.org/ebooks";
const REQUEST_TIMEOUT_MS = 30000;

type HttpError = Error & {
  statusCode?: number;
};

type DownloadSelection = {
  mimeType: string;
  url: string;
};

const FORMAT_PRIORITY: Record<GutenbergFormatPreference, string[]> = {
  auto: [
    "application/epub+zip",
    "text/html",
    "text/plain",
    "application/x-mobipocket-ebook",
  ],
  epub: [
    "application/epub+zip",
    "text/html",
    "text/plain",
    "application/x-mobipocket-ebook",
  ],
  html: [
    "text/html",
    "application/epub+zip",
    "text/plain",
    "application/x-mobipocket-ebook",
  ],
  text: [
    "text/plain",
    "application/epub+zip",
    "text/html",
    "application/x-mobipocket-ebook",
  ],
  kindle: [
    "application/x-mobipocket-ebook",
    "application/epub+zip",
    "text/html",
    "text/plain",
  ],
};

function createHttpError(statusCode: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function pickFirstMatchingFormat(
  formats: Record<string, string>,
  mimePrefixes: string[]
): DownloadSelection | null {
  for (const mimePrefix of mimePrefixes) {
    const match = Object.entries(formats).find(([mimeType]) =>
      mimeType.startsWith(mimePrefix)
    );

    if (match) {
      return {
        mimeType: match[0],
        url: match[1],
      };
    }
  }

  return null;
}

function getThumbnailUrl(formats: Record<string, string>): string | null {
  const thumbnail = pickFirstMatchingFormat(formats, ["image/jpeg"]);
  return thumbnail?.url ?? null;
}

function getAuthorNames(authors: GutendexBook["authors"]): string[] {
  return authors.map((author) => author.name);
}

function mapBook(
  book: GutendexBook,
  formatPreference: GutenbergFormatPreference
): GutenbergBookResult | null {
  const selection = pickFirstMatchingFormat(
    book.formats,
    FORMAT_PRIORITY[formatPreference]
  );

  if (!selection) {
    return null;
  }

  const authors = getAuthorNames(book.authors);
  const thumbnailUrl = getThumbnailUrl(book.formats);
  const landingPageUrl = `${GUTENBERG_LANDING_PAGE_BASE_URL}/${book.id}`;

  return {
    gutenbergId: book.id,
    title: book.title,
    author: authors[0] ?? null,
    authors,
    thumbnailUrl,
    coverUrl: thumbnailUrl,
    downloadUrl: selection.url,
    mirrorUrl: selection.url,
    landingPageUrl,
    mimeType: selection.mimeType,
    languages: book.languages,
    downloadCount: book.download_count,
    summary: book.summaries[0] ?? null,
  };
}

async function fetchJson<T>(url: URL): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    logDebug("GutenbergService", "Starting Gutendex request", {
      url: url.toString(),
      timeoutMs: REQUEST_TIMEOUT_MS,
    });

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "application/json",
      },
    });

    logDebug("GutenbergService", "Gutendex responded", {
      requestedUrl: url.toString(),
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      throw createHttpError(
        response.status,
        `Gutendex request failed with status ${response.status}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logDebug("GutenbergService", "Gutendex request timed out", {
        url: url.toString(),
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
      throw createHttpError(504, "Gutendex request timed out");
    }

    if (error instanceof Error) {
      logDebug("GutenbergService", "Gutendex request failed", {
        url: url.toString(),
        errorName: error.name,
        errorMessage: error.message,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

class GutenbergService {
  static async searchBooks(
    query: string,
    page: number = 1,
    formatPreference: GutenbergFormatPreference = "epub",
    language?: string
  ): Promise<GutenbergSearchResults> {
    const url = new URL("/books/", GUTENDEX_BASE_URL);
    url.searchParams.set("search", query);
    url.searchParams.set("page", String(page));

    if (language) {
      url.searchParams.set("languages", language);
    }

    logDebug("GutenbergService", "Searching Gutendex catalog", {
      query,
      page,
      formatPreference,
      language: language ?? null,
    });

    const data = await fetchJson<GutendexSearchResponse>(url);
    const results = data.results
      .map((book) => mapBook(book, formatPreference))
      .filter((book): book is GutenbergBookResult => book !== null);

    logDebug("GutenbergService", "Gutendex search completed", {
      query,
      page,
      total: data.count,
      returnedResults: results.length,
    });

    return {
      query,
      total: data.count,
      nextPageUrl: data.next,
      previousPageUrl: data.previous,
      results,
    };
  }

  static async getBookDownloadInfo(
    gutenbergId: number,
    formatPreference: GutenbergFormatPreference = "epub"
  ): Promise<GutenbergBookResult> {
    const url = new URL(`/books/${gutenbergId}`, GUTENDEX_BASE_URL);

    logDebug("GutenbergService", "Loading Gutendex book", {
      gutenbergId,
      formatPreference,
    });

    try {
      const book = await fetchJson<GutendexBook>(url);
      const mappedBook = mapBook(book, formatPreference);

      if (!mappedBook) {
        throw createHttpError(
          404,
          "No supported downloadable format found for this Gutenberg book"
        );
      }

      logDebug("GutenbergService", "Loaded Gutendex book", {
        gutenbergId,
        mimeType: mappedBook.mimeType,
      });

      return mappedBook;
    } catch (error) {
      const httpError = error as HttpError;

      if (
        httpError.statusCode === 404 &&
        httpError.message === "Gutendex request failed with status 404"
      ) {
        throw createHttpError(404, "Gutenberg book not found");
      }

      throw error;
    }
  }
}

export default GutenbergService;
