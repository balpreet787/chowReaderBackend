import { Request, Response } from "express";
import { Book } from "../types/book";
import { registerBook } from "../models/book";
import GutenbergService from "../services/gutenbergService";
import { GutenbergFormatPreference } from "../types/gutenberg";
import { logDebug } from "../utils/debug";

type DatabaseError = Error & {
  code?: string;
  table_name?: string;
  constraint_name?: string;
  statusCode?: number;
};

function isUniqueViolation(error: unknown): error is DatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as DatabaseError).code === "23505"
  );
}

function isBookFingerprintConflict(
  error: unknown
): error is DatabaseError {
  return (
    isUniqueViolation(error) &&
    (
      (error.table_name === "books") ||
      (error.constraint_name === "books_fingerprint_key")
    )
  );
}

function createHttpError(statusCode: number, message: string): DatabaseError {
  const error = new Error(message) as DatabaseError;
  error.statusCode = statusCode;
  return error;
}

function parseRequiredQueryString(
  value: unknown,
  fieldName: string
): string {
  if (Array.isArray(value)) {
    throw createHttpError(400, `${fieldName} must only be provided once`);
  }

  if (typeof value !== "string" || !value.trim()) {
    throw createHttpError(
      400,
      `${fieldName} is required and must be a non-empty string`
    );
  }

  return value.trim();
}

function parseOptionalQueryString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw createHttpError(400, "Query parameter must only be provided once");
  }

  if (typeof value !== "string") {
    throw createHttpError(400, "Query parameter must be a string");
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function parsePositiveInteger(
  value: unknown,
  fieldName: string
): number | undefined {
  const rawValue = parseOptionalQueryString(value);

  if (rawValue === undefined) {
    return undefined;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw createHttpError(400, `${fieldName} must be a positive integer`);
  }

  return parsedValue;
}

function parseFormatPreference(
  value: unknown
): GutenbergFormatPreference {
  const rawValue = parseOptionalQueryString(value) ?? "epub";

  if (
    rawValue !== "auto" &&
    rawValue !== "epub" &&
    rawValue !== "html" &&
    rawValue !== "text" &&
    rawValue !== "kindle"
  ) {
    throw createHttpError(
      400,
      "format must be one of auto, epub, html, text, or kindle"
    );
  }

  return rawValue;
}

export async function addBook(
  req: Request,
  res: Response
): Promise<Response> {
  const { fingerprint, title, author, createdBy } = req.body;

  if (!fingerprint || !title || !author || !createdBy) {
    return res.status(400).json({
      success: false,
      message: "All fields (fingerprint, title, author, createdBy) are required.",
    });
  }

  try {
    const book: Book = {
      fingerprint,
      title,
      author,
      created_by: createdBy,
    };

    logDebug("BookController", "Attempting to register book", {
      fingerprint,
      title,
      createdBy,
    });

    const addedBook = await registerBook(book);

    logDebug("BookController", "Book registered successfully", {
      fingerprint,
      title,
    });

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: addedBook,
    });
  } catch (error) {
    if (isBookFingerprintConflict(error)) {
      logDebug("BookController", "Book registration conflict", {
        fingerprint,
      });

      return res.status(409).json({
        success: false,
        message: "Book with this fingerprint already exists.",
      });
    }

    console.error("Error adding book:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
}

export async function searchGutenbergBooks(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const query = parseRequiredQueryString(req.query.q, "q");
    const page = parsePositiveInteger(req.query.page, "page") ?? 1;
    const format = parseFormatPreference(req.query.format);
    const language = parseOptionalQueryString(req.query.language);

    logDebug("BookController", "Received Gutenberg search request", {
      query,
      page,
      format,
      language: language ?? null,
    });

    const results = await GutenbergService.searchBooks(
      query,
      page,
      format,
      language
    );

    return res.status(200).json(results);
  } catch (error) {
    const httpError = error as DatabaseError;
    const statusCode = httpError.statusCode ?? 500;

    if (statusCode === 500) {
      console.error("Error searching Gutenberg books:", error);
    }

    return res.status(statusCode).json({
      error: httpError.message || "Failed to search Gutenberg books",
    });
  }
}

export async function getGutenbergDownloadInfo(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const gutenbergId = Number(req.params.gutenbergId);
    const format = parseFormatPreference(req.query.format);

    if (!Number.isInteger(gutenbergId) || gutenbergId < 1) {
      throw createHttpError(
        400,
        "gutenbergId must be a positive integer"
      );
    }

    logDebug("BookController", "Received Gutenberg download info request", {
      gutenbergId,
      format,
    });

    const book = await GutenbergService.getBookDownloadInfo(
      gutenbergId,
      format
    );

    return res.status(200).json(book);
  } catch (error) {
    const httpError = error as DatabaseError;
    const statusCode = httpError.statusCode ?? 500;

    if (statusCode === 500) {
      console.error("Error loading Gutenberg download info:", error);
    }

    return res.status(statusCode).json({
      error: httpError.message || "Failed to load Gutenberg download info",
    });
  }
}
