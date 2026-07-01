// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ----------------------------------------------------
// Firebase config from Vite env (.env.local)
// ----------------------------------------------------
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// ----------------------------------------------------
// Core Firebase singletons
// ----------------------------------------------------
export const app = initializeApp(firebaseConfig);

// ----------------------------------------------------
// App Check (reCAPTCHA v3)
// ----------------------------------------------------
// Attaches a Firebase App Check attestation token to every Firestore /
// Auth / Cloud Function request from a real browser session, so the
// backend can distinguish real users from scripted clients. Enforcement
// is a Console-side toggle — this init just makes tokens *available*.
//
// In dev, set FIREBASE_APPCHECK_DEBUG_TOKEN to a boolean before init to
// generate a debug token you can whitelist in Firebase Console → App
// Check → Debug tokens. Without it, App Check would block localhost.
if (typeof window !== "undefined") {
  const siteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY as string | undefined;

  // Dev-only debug token generator — has no effect in production because
  // `import.meta.env.DEV` is stripped by Vite at build time.
  if (import.meta.env.DEV) {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  if (siteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      // Init can throw if hot-reload double-initializes; log but don't crash.
      console.warn("[appcheck] init failed:", (err as any)?.message || err);
    }
  } else if (import.meta.env.PROD) {
    // Fail loud in prod if the key isn't wired — App Check silently
    // absent is exactly the class of miss we want to catch.
    console.error(
      "[appcheck] VITE_APP_CHECK_SITE_KEY is not set. App Check tokens will NOT be attached to backend requests."
    );
  }
}

// Auth
export const auth = getAuth(app);

// Local persistence: users stay signed in across browser closes until they
// explicitly sign out or their refresh token is revoked server-side (see
// POST /api/auth/revoke-sessions). Standard for consumer marketplaces —
// Amazon/Flipkart/Meesho all do this. Sensitive actions (payouts, bank
// account changes) are gated separately by the server-side requireRecentAuth
// middleware, which forces a password re-entry if the ID token is stale.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // ignore persistence errors in dev (private browsing, storage blocked)
});

// Firestore
export const db = getFirestore(app);

// ----------------------------------------------------
// Safe lookup of current user via Identity Toolkit
// (used only when you really need to confirm status)
// ----------------------------------------------------
interface SafeLookupUserInfo {
  uid: string;
  email: string;
  emailVerified: boolean;
  disabled: boolean;
  providerUserInfo: any[];
}

/**
 * Calls Google Identity Toolkit "accounts:lookup" with the current user's ID token.
 * If the token is invalid/expired, it signs the user out and returns null.
 */
export async function safeLookupCurrentUser(): Promise<SafeLookupUserInfo | null> {
  const u = auth.currentUser;
  if (!u) {
    // No logged-in user in this browser
    return null;
  }

  try {
    const idToken = await u.getIdToken(/* forceRefresh */ true);

    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!resp.ok) {
      // 400/401 likely means invalid / revoked token
      if (resp.status === 400 || resp.status === 401) {
        console.warn(
          "safeLookupCurrentUser: ID token invalid; signing user out."
        );
        try {
          await signOut(auth);
        } catch {
          /* ignore */
        }
        return null;
      }

      console.warn(
        "safeLookupCurrentUser: non-OK response from accounts:lookup",
        resp.status
      );
      return null;
    }

    const data = await resp.json();
    const users = (data && (data.users || data.user)) ?? [];
    if (!Array.isArray(users) || users.length === 0) return null;

    const userInfo = users[0] || {};
    return {
      uid: u.uid,
      email: userInfo.email ?? u.email ?? "",
      emailVerified: !!userInfo.emailVerified,
      disabled: !!userInfo.disabled,
      providerUserInfo: userInfo.providerUserInfo ?? [],
    };
  } catch (err) {
    console.error("safeLookupCurrentUser error:", err);
    return null;
  }
}
