import sql, { DbClient } from "../lib/db";
import { Book } from "../types/book";


export async function registerBook(book: Book) : Promise<Book> {
  const { fingerprint, title, author, created_by } = book;

  if (!fingerprint || !title || !author || !created_by) {
    throw new Error("All book fields are required");
  }

  const [newBook] = await sql<Book[]>`
    INSERT INTO public.books (fingerprint, title, author, created_by)
    VALUES (${fingerprint}, ${title}, ${author}, ${created_by})
    RETURNING id, fingerprint, title, author, created_by
  `;

  if (!newBook) {
    throw new Error("Failed to add book");
  }

  return newBook;
}

export async function getBookByFingerprint(
  fingerprint: string): Promise<Book | null> {
  const [book] = await sql<Book[]>`
    SELECT id, fingerprint, title, author, created_by
    FROM public.books
    WHERE fingerprint = ${fingerprint}
  `;

  return book ?? null;
}