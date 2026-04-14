import { NextFunction, Request, Response } from "express";
import {
  getAppCheck,
  VerifyAppCheckTokenResponse,
} from "firebase-admin/app-check";
import { getFirebaseAdminApp } from "../lib/firebaseAdmin";

const APP_CHECK_HEADER = "X-Firebase-AppCheck";
const appCheck = getAppCheck(getFirebaseAdminApp());

type FirebaseAppCheckLikeError = Error & {
  code?: string;
  hasCode?: (code: string) => boolean;
};

function hasFirebaseErrorCode(
  error: unknown,
  code: string
): error is FirebaseAppCheckLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    (
      ("hasCode" in error &&
        typeof (error as FirebaseAppCheckLikeError).hasCode === "function" &&
        (error as FirebaseAppCheckLikeError).hasCode?.(code) === true) ||
      ("code" in error &&
        (error as FirebaseAppCheckLikeError).code === `app-check/${code}`)
    )
  );
}

function logAppCheckFailure(
  message: string,
  req: Request,
  error?: FirebaseAppCheckLikeError
): void {
  console.error(message, {
    method: req.method,
    path: req.originalUrl,
    code: error?.code ?? null,
    message: error?.message ?? null,
  });
}

function logAppCheckSuccess(
  req: Request,
  verifiedToken: VerifyAppCheckTokenResponse
): void {
  console.info("Verified App Check token", {
    method: req.method,
    path: req.originalUrl,
    appId: verifiedToken.appId,
  });
}

export async function requireAppCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.header(APP_CHECK_HEADER);

  if (!token) {
    console.warn("Missing App Check token", {
      method: req.method,
      path: req.originalUrl,
    });
    res.status(401).json({
      error: "Missing App Check token",
      code: "missing_app_check_token",
    });
    return;
  }

  try {
    const verifiedToken = await appCheck.verifyToken(token);
    logAppCheckSuccess(req, verifiedToken);
    res.locals.appCheck = verifiedToken;
    next();
  } catch (error) {
    if (hasFirebaseErrorCode(error, "app-check-token-expired")) {
      logAppCheckFailure("Expired App Check token", req, error);
      res.status(401).json({
        error: "App Check token expired",
        code: "app_check_token_expired",
      });
      return;
    }

    if (
      hasFirebaseErrorCode(error, "invalid-argument") ||
      hasFirebaseErrorCode(error, "permission-denied") ||
      hasFirebaseErrorCode(error, "unauthenticated")
    ) {
      logAppCheckFailure(
        "Invalid App Check token. If you are using the debug provider, ensure the current debug token is allowlisted in Firebase Console.",
        req,
        error
      );
      res.status(401).json({
        error: "Invalid App Check token",
        code: "invalid_app_check_token",
      });
      return;
    }

    logAppCheckFailure(
      "App Check verification is unavailable. Check Firebase Admin credentials and project configuration.",
      req,
      error as FirebaseAppCheckLikeError
    );
    res.status(500).json({
      error: "App Check verification unavailable",
      code: "app_check_verification_unavailable",
    });
  }
}
