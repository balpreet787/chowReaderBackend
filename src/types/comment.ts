export type CommentAnchorType = "chapter" | "selection";

export interface CreateCommentThreadInput {
  fingerprint: string;
  userId: string;
  chapterHref: string;
  anchorType: CommentAnchorType;
  startLocator: string;
  endLocator: string | null;
  selectedText: string | null;
  contextBefore: string | null;
  contextAfter: string | null;
  body: string;
}

export interface CommentRecord {
  id: string;
  threadId: string;
  userId: string;
  username: string;
  body: string;
  parentCommentId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

export interface Comment {
  id: string;
  threadId: string;
  userId: string;
  username: string;
  body: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CommentThreadRecord {
  id: string;
  bookId: string;
  chapterHref: string;
  anchorType: CommentAnchorType;
  startLocator: string | null;
  endLocator: string | null;
  selectedText: string | null;
  contextBefore: string | null;
  contextAfter: string | null;
  createdBy: string;
  createdAt: Date | string;
}

export interface CommentThread {
  id: string;
  bookId: string;
  chapterHref: string;
  anchorType: CommentAnchorType;
  startLocator: string | null;
  endLocator: string | null;
  selectedText: string | null;
  contextBefore: string | null;
  contextAfter: string | null;
  createdBy: string;
  createdAt: string;
  comments: Comment[];
}
