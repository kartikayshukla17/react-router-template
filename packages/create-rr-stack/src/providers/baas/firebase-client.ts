import { defineProvider } from "../define-provider.js";

/**
 * The shared Firebase client fragment: installs `firebase` (the browser
 * client SDK, for `firebase/auth`'s `signInWithEmailAndPassword` etc.) and
 * `firebase-admin` (the server SDK, for session-cookie verification) once,
 * regardless of how many selected providers independently need Firebase —
 * today: `auth/firebase-auth`; later: ticket 014's Firebase Storage. Same
 * shared-fragment shape as `providers/baas/supabase-client.ts`, but ships
 * two files instead of one: Firebase's admin/client split is a harder
 * boundary than Supabase's single isomorphic-ish `supabase-js` client,
 * since Firebase's Admin SDK can only verify/manage tokens it never
 * accepts raw credentials — so the actual email/password sign-in call has
 * to happen in the browser, against the client SDK.
 */
export const firebaseClientProvider = defineProvider({
  layer: "baas",
  id: "firebase-client",
  label: "Firebase client",
  deps: {
    firebase: "^13.4.0",
    "firebase-admin": "^14.5.1",
  },
  devDeps: {},
  env: [
    {
      name: "VITE_FIREBASE_API_KEY",
      description: "Your Firebase web app's API key (exposed to the browser)",
      whereToFind:
        "Firebase console (https://console.firebase.google.com) → Project settings → General → Your apps → Web app → SDK setup and configuration",
      secret: false,
    },
    {
      name: "VITE_FIREBASE_AUTH_DOMAIN",
      description: "Your Firebase project's auth domain (exposed to the browser)",
      whereToFind: "Firebase console → Project settings → General → Your apps → Web app",
      secret: false,
    },
    {
      name: "VITE_FIREBASE_PROJECT_ID",
      description: "Your Firebase project ID (used by both the browser client and the Admin SDK)",
      whereToFind: "Firebase console → Project settings → General → Project ID",
      secret: false,
    },
    {
      name: "FIREBASE_CLIENT_EMAIL",
      description: "Service account client email, used by the Admin SDK on the server",
      whereToFind:
        "Firebase console → Project settings → Service accounts → Generate new private key (downloads a JSON key file; copy its client_email field)",
      secret: true,
    },
    {
      name: "FIREBASE_PRIVATE_KEY",
      description:
        "Service account private key, used by the Admin SDK on the server (keep the \\n escapes from the downloaded key file as-is)",
      whereToFind:
        "Firebase console → Project settings → Service accounts → Generate new private key (copy its private_key field)",
      secret: true,
    },
  ],
  files: "providers/baas/firebase-client",
  fileManifest: ["app/lib/firebase-client.ts", "app/server/firebase-admin.ts"],
  nextSteps: [
    "Enable Email/Password sign-in in the Firebase console → Authentication → Sign-in method.",
  ],
});
