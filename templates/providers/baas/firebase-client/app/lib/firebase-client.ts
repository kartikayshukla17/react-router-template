/**
 * Shared Firebase browser client. The only place `firebase/app`/`firebase/
 * auth` are initialized — routes that need to sign a user in or up (e.g.
 * the `/sign-in` route shipped by `auth/firebase-auth`) import
 * `firebaseAuth` from here rather than calling `initializeApp` themselves.
 *
 * Lives under `app/lib/`, not `app/server/`: unlike `firebase-admin.ts`
 * (sibling file, same fragment), this module runs in the browser —
 * `VITE_`-prefixed env vars are Vite's convention for exposing a value to
 * client code, read here via `import.meta.env` rather than `process.env`.
 *
 * `getApps()[0] ??` guards against React Router's dev-mode HMR re-running
 * this module and calling `initializeApp` twice for the same config, which
 * Firebase's client SDK throws on.
 */
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
