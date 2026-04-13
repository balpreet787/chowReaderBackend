import sql, { DbClient } from "../lib/db";
import { User } from "../types/user";

export async function getUserById(
  id: string,
  db: DbClient = sql
): Promise<User | null> {
  const [user] = await db<User[]>`
    SELECT id, username, status
    FROM public.users
    WHERE id = ${id}
  `;

  return user ?? null;
}

export async function getUserByUsername(
  username: string,
  db: DbClient = sql
): Promise<User | null> {
  const [user] = await db<User[]>`
    SELECT id, username, status
    FROM public.users
    WHERE username = ${username}
  `;
  return user ?? null;
}

export async function createUser(
  username: string,
  db: DbClient = sql
): Promise<User> {
  if (!username.trim()) {
    throw new Error("Username is required");
  }

  const [user] = await db<User[]>`
    INSERT INTO public.users (username, status)
    VALUES (${username}, 'active')
    RETURNING id, username, status
  `;

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

export async function updateUserStatus(
  id: number,
  status: "active" | "banned" | "deleted",
  db: DbClient = sql
): Promise<User | null> {
  const result = await db<User[]>`
    UPDATE public.users
    SET status = ${status}
    WHERE id = ${id}
    RETURNING id, username, status
  `;
  return result[0] || null;
}
