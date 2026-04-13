import { Request, Response } from "express";
import CommentThreadModel from "../models/commentThread";
import { CommentAnchorType, CreateCommentThreadInput } from "../types/comment";
import { logDebug } from "../utils/debug";

type HttpError = Error & {
  statusCode?: number;
};

function createHttpError(
  statusCode: number,
  message: string
): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function parseRequiredString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw createHttpError(
      400,
      `${fieldName} is required and must be a non-empty string`
    );
  }

  return value.trim();
}

function parseOptionalString(
  value: unknown,
  fieldName: string
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${fieldName} must be a string or null`);
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function parseAnchorType(value: unknown): CommentAnchorType {
  const anchorType = parseRequiredString(value, "anchorType");

  if (anchorType !== "chapter" && anchorType !== "selection") {
    throw createHttpError(
      400,
      "anchorType must be either 'chapter' or 'selection'"
    );
  }

  return anchorType;
}

function parseRequiredQueryParam(
  value: unknown,
  fieldName: string
): string {
  if (Array.isArray(value)) {
    throw createHttpError(400, `${fieldName} must only be provided once`);
  }

  return parseRequiredString(value, fieldName);
}

function parseOptionalQueryParam(
  value: unknown,
  fieldName: string
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw createHttpError(400, `${fieldName} must only be provided once`);
  }

  return parseOptionalString(value, fieldName) ?? undefined;
}

function parseCreateCommentThreadInput(
  body: Request["body"]
): CreateCommentThreadInput {
  return {
    fingerprint: parseRequiredString(body.fingerprint, "fingerprint"),
    userId: parseRequiredString(body.userId, "userId"),
    chapterHref: parseRequiredString(body.chapterHref, "chapterHref"),
    anchorType: parseAnchorType(body.anchorType),
    startLocator: parseRequiredString(body.startLocator, "startLocator"),
    endLocator: parseOptionalString(body.endLocator, "endLocator"),
    selectedText: parseOptionalString(body.selectedText, "selectedText"),
    contextBefore: parseOptionalString(body.contextBefore, "contextBefore"),
    contextAfter: parseOptionalString(body.contextAfter, "contextAfter"),
    body: parseRequiredString(body.body, "body"),
  };
}

function handleControllerError(
  error: unknown,
  res: Response,
  fallbackMessage: string
): Response {
  const httpError = error as HttpError;
  const statusCode = httpError.statusCode ?? 500;
  const message = httpError.message || fallbackMessage;

  if (statusCode === 500) {
    console.error(fallbackMessage, error);
  }

  return res.status(statusCode).json({ error: message });
}

export async function handleCreateCommentThread(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    logDebug("CommentThreadController", "Received create comment thread request");

    const input = parseCreateCommentThreadInput(req.body);
    const thread = await CommentThreadModel.create(input);

    logDebug("CommentThreadController", "Sending create comment thread response", {
      threadId: thread.id,
      commentCount: thread.comments.length,
    });

    return res.status(201).json(thread);
  } catch (error) {
    return handleControllerError(error, res, "Failed to create comment thread");
  }
}

export async function handleListCommentThreads(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    logDebug("CommentThreadController", "Received list comment threads request", {
      fingerprint: req.query.fingerprint,
      chapterHref: req.query.chapterHref,
    });

    const fingerprint = parseRequiredQueryParam(
      req.query.fingerprint,
      "fingerprint"
    );
    const chapterHref = parseOptionalQueryParam(
      req.query.chapterHref,
      "chapterHref"
    );

    const threads = await CommentThreadModel.listByFingerprint(
      fingerprint,
      chapterHref
    );

    logDebug("CommentThreadController", "Sending list comment threads response", {
      fingerprint,
      chapterHref: chapterHref ?? null,
      threadCount: threads.length,
    });

    return res.status(200).json(threads);
  } catch (error) {
    return handleControllerError(error, res, "Failed to load comment threads");
  }
}
