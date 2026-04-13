import { Request, Response } from "express";
import sql, { DbClient } from "../lib/db";
import {
  createDeviceIdentity,
  findDeviceByHash,
} from "../models/deviceIdentities";
import { createUser, getUserById } from "../models/user";
import { User } from "../types/user";
import { generateUsername } from "../utils/usernames";

const MAX_USERNAME_GENERATION_ATTEMPTS = 10;
type DatabaseError = Error & {
  code?: string;
  table_name?: string;
  constraint_name?: string;
};

export async function handleCreateUser(
  req: Request,
  res: Response
): Promise<Response | void> {
  const { androidIdHash } = req.body;

  if (
    !androidIdHash ||
    typeof androidIdHash !== "string" ||
    !androidIdHash.trim()
  ) {
    return res
      .status(400)
      .json({ error: "androidIdHash is required and must be a string" });
  }

  const existingUser = await getExistingUserByDevice(androidIdHash);
  if (existingUser) {
    return res.status(200).json({
      userId: existingUser.id,
      username: existingUser.username,
    });
  }

  for (let attempt = 0; attempt < MAX_USERNAME_GENERATION_ATTEMPTS; attempt += 1) {
    const username = generateUsername();

    try {
      const result = await sql.begin(async (tx) => {
        const db = tx as unknown as DbClient;
        const user = await createUser(username, db);
        const deviceIdentity = await createDeviceIdentity(
          user.id,
          androidIdHash,
          db
        );

        return {
          user,
          deviceIdentity,
        };
      });

      return res.status(201).json({ userId: result.user.id, username: result.user.username });
    } catch (error) {
      if (isUsernameConflict(error)) {
        continue;
      }

      if (isDeviceConflict(error)) {
        const existingUserOnConflict = await getExistingUserByDevice(androidIdHash);
        if (existingUserOnConflict) {
          return res.status(200).json({
            userId: existingUserOnConflict.id,
            username: existingUserOnConflict.username,
          });
        }
      }

      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
  }

  return res.status(503).json({ error: "Failed to generate a unique username" });
}

function isDeviceConflict(error: unknown): error is DatabaseError {
  return isUniqueViolation(error) && error.table_name === "device_identities";
}

function isUsernameConflict(error: unknown): error is DatabaseError {
  return isUniqueViolation(error) && error.table_name === "users";
}

function isUniqueViolation(error: unknown): error is DatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as DatabaseError).code === "23505"
  );
}

async function getExistingUserByDevice(
  androidIdHash: string
): Promise<User | null> {
  const deviceIdentity = await findDeviceByHash(androidIdHash);

  if (!deviceIdentity) {
    return null;
  }

  return getUserById(deviceIdentity.user_id);
}
