import sql, { DbClient } from "../lib/db";
import {
  Comment,
  CommentRecord,
  CommentThread,
  CommentThreadRecord,
  CreateCommentThreadInput,
} from "../types/comment";
import { logDebug } from "../utils/debug";
import { toIsoString, toNullableIsoString } from "../utils/dateTime";
import { getUserById } from "./user";

type BookLookupRow = {
  id: string;
};

type ModelError = Error & {
  statusCode?: number;
};

class CommentThreadModel {
  private static createModelError(
    message: string,
    statusCode: number
  ): ModelError {
    const error = new Error(message) as ModelError;
    error.statusCode = statusCode;
    return error;
  }

  private static mapComment(record: CommentRecord): Comment {
    return {
      id: record.id,
      threadId: record.threadId,
      userId: record.userId,
      username: record.username,
      body: record.body,
      parentCommentId: record.parentCommentId,
      createdAt: toIsoString(record.createdAt),
      updatedAt: toNullableIsoString(record.updatedAt),
    };
  }

  private static mapThread(
    record: CommentThreadRecord,
    comments: Comment[]
  ): CommentThread {
    return {
      id: record.id,
      bookId: record.bookId,
      chapterHref: record.chapterHref,
      anchorType: record.anchorType,
      startLocator: record.startLocator,
      endLocator: record.endLocator,
      selectedText: record.selectedText,
      contextBefore: record.contextBefore,
      contextAfter: record.contextAfter,
      createdBy: record.createdBy,
      createdAt: toIsoString(record.createdAt),
      comments,
    };
  }

  private static async getBookIdByFingerprint(
    fingerprint: string,
    db: DbClient = sql
  ): Promise<string | null> {
    logDebug("CommentThreadModel", "Resolving book by fingerprint", {
      fingerprint,
    });

    const [book] = await db<BookLookupRow[]>`
      SELECT id
      FROM public.books
      WHERE fingerprint = ${fingerprint}
    `;

    logDebug("CommentThreadModel", "Book fingerprint lookup completed", {
      fingerprint,
      found: Boolean(book?.id),
      bookId: book?.id ?? null,
    });

    return book?.id ?? null;
  }

  static async create(
    input: CreateCommentThreadInput
  ): Promise<CommentThread> {
    const {
      fingerprint,
      userId,
      chapterHref,
      anchorType,
      startLocator,
      endLocator,
      selectedText,
      contextBefore,
      contextAfter,
      body,
    } = input;

    logDebug("CommentThreadModel", "Creating comment thread", {
      fingerprint,
      userId,
      chapterHref,
      anchorType,
      hasSelectedText: Boolean(selectedText),
    });

    return sql.begin(async (tx) => {
      const db = tx as unknown as DbClient;
      const bookId = await CommentThreadModel.getBookIdByFingerprint(
        fingerprint,
        db
      );

      if (!bookId) {
        logDebug("CommentThreadModel", "Comment thread creation failed: book not found", {
          fingerprint,
        });
        throw CommentThreadModel.createModelError(
          "Book not found for fingerprint",
          404
        );
      }

      const user = await getUserById(userId, db);
      if (!user) {
        logDebug("CommentThreadModel", "Comment thread creation failed: user not found", {
          userId,
        });
        throw CommentThreadModel.createModelError("User not found", 404);
      }

      const [thread] = await db<CommentThreadRecord[]>`
        INSERT INTO public.comment_threads (
          book_id,
          chapter_href,
          anchor_type,
          start_locator,
          end_locator,
          selected_text,
          context_before,
          context_after,
          created_by
        )
        VALUES (
          ${bookId},
          ${chapterHref},
          ${anchorType},
          ${startLocator},
          ${endLocator},
          ${selectedText},
          ${contextBefore},
          ${contextAfter},
          ${userId}
        )
        RETURNING
          id,
          book_id AS "bookId",
          chapter_href AS "chapterHref",
          anchor_type AS "anchorType",
          start_locator AS "startLocator",
          end_locator AS "endLocator",
          selected_text AS "selectedText",
          context_before AS "contextBefore",
          context_after AS "contextAfter",
          created_by AS "createdBy",
          created_at AS "createdAt"
      `;

      if (!thread) {
        throw CommentThreadModel.createModelError(
          "Failed to create comment thread",
          500
        );
      }

      const [comment] = await db<CommentRecord[]>`
        INSERT INTO public.comments (
          thread_id,
          user_id,
          body,
          parent_comment_id
        )
        VALUES (
          ${thread.id},
          ${userId},
          ${body},
          NULL
        )
        RETURNING
          id,
          thread_id AS "threadId",
          user_id AS "userId",
          ${user.username} AS "username",
          body,
          parent_comment_id AS "parentCommentId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;

      if (!comment) {
        throw CommentThreadModel.createModelError(
          "Failed to create initial comment",
          500
        );
      }

      logDebug("CommentThreadModel", "Comment thread created successfully", {
        threadId: thread.id,
        bookId,
        commentId: comment.id,
      });

      return CommentThreadModel.mapThread(thread, [
        CommentThreadModel.mapComment(comment),
      ]);
    });
  }

  static async listByFingerprint(
    fingerprint: string,
    chapterHref?: string
  ): Promise<CommentThread[]> {
    logDebug("CommentThreadModel", "Listing comment threads", {
      fingerprint,
      chapterHref: chapterHref ?? null,
    });

    const bookId = await CommentThreadModel.getBookIdByFingerprint(fingerprint);
    if (!bookId) {
      logDebug("CommentThreadModel", "No book found while listing comment threads", {
        fingerprint,
      });
      return [];
    }

    const threads = await sql<CommentThreadRecord[]>`
      SELECT
        id,
        book_id AS "bookId",
        chapter_href AS "chapterHref",
        anchor_type AS "anchorType",
        start_locator AS "startLocator",
        end_locator AS "endLocator",
        selected_text AS "selectedText",
        context_before AS "contextBefore",
        context_after AS "contextAfter",
        created_by AS "createdBy",
        created_at AS "createdAt"
      FROM public.comment_threads
      WHERE book_id = ${bookId}
      ${
        chapterHref
          ? sql`
              AND chapter_href = ${chapterHref}
            `
          : sql``
      }
      ORDER BY created_at ASC
    `;

    if (threads.length === 0) {
      logDebug("CommentThreadModel", "No comment threads found", {
        fingerprint,
        bookId,
        chapterHref: chapterHref ?? null,
      });
      return [];
    }

    const threadIds = threads.map((thread) => thread.id);
    const comments = await sql<CommentRecord[]>`
      SELECT
        comments.id,
        comments.thread_id AS "threadId",
        comments.user_id AS "userId",
        users.username AS "username",
        comments.body,
        comments.parent_comment_id AS "parentCommentId",
        comments.created_at AS "createdAt",
        comments.updated_at AS "updatedAt"
      FROM public.comments
      INNER JOIN public.users
        ON users.id = comments.user_id
      WHERE comments.thread_id IN ${sql(threadIds)}
      ORDER BY comments.created_at ASC
    `;

    const commentsByThreadId = new Map<string, Comment[]>();

    for (const commentRecord of comments) {
      const comment = CommentThreadModel.mapComment(commentRecord);
      const threadComments = commentsByThreadId.get(comment.threadId) ?? [];
      threadComments.push(comment);
      commentsByThreadId.set(comment.threadId, threadComments);
    }

    logDebug("CommentThreadModel", "Loaded comment threads", {
      fingerprint,
      bookId,
      chapterHref: chapterHref ?? null,
      threadCount: threads.length,
      commentCount: comments.length,
    });

    return threads.map((thread) =>
      CommentThreadModel.mapThread(
        thread,
        commentsByThreadId.get(thread.id) ?? []
      )
    );
  }
}

export default CommentThreadModel;
