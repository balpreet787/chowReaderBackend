import {
  App,
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
