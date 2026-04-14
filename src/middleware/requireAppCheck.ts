import { NextFunction, Request, Response } from "express";
import { getAppCheck } from "firebase-admin/app-check";
import { getFirebaseAdminApp } from "../lib/firebaseAdmin";

const APP_CHECK_HEADER = "X-Firebase-AppCheck";
const appCheck = getAppCheck(getFirebaseAdminApp());

export async function requireAppCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.header(APP_CHECK_HEADER);

  if (!token) {
    res.status(401).json({ error: "Missing App Check token" });
    return;
  }

  try {
    const verifiedToken = await appCheck.verifyToken(token);
    res.locals.appCheck = verifiedToken;
    next();
  } catch (error) {
    console.error("Failed to verify App Check token:", error);
    res.status(401).json({ error: "Invalid App Check token" });
  }
}
