import admin from "firebase-admin";

let initialized = false;

function initAdmin() {
  if (initialized) return admin;
  try {
    if (admin.apps.length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(svc),
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
    }
    initialized = true;
  } catch (err) {
    console.error("[firebase-admin] init failed", err?.message || err);
    throw err;
  }
  return admin;
}

export async function verifyIdToken(idToken) {
  const app = initAdmin();
  const decoded = await app.auth().verifyIdToken(idToken);
  return decoded;
}

export function firebaseAdmin() {
  return initAdmin();
}
