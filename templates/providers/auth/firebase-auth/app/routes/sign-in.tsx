/**
 * Firebase's Admin SDK (used everywhere else in this fragment) can only
 * verify/manage tokens, never accept a raw email/password — so, uniquely
 * among this project's auth providers, the actual sign-in/sign-up call has
 * to happen here, client-side, against `~/lib/firebase-client`. Once the
 * browser has an ID token, it's handed to this same route's `action` (via
 * `useFetcher`, not a plain form submit, since the Firebase call is async
 * and must complete first) which exchanges it for a session cookie.
 */
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useFetcher } from "react-router";
import { firebaseAuth } from "~/lib/firebase-client";
import { createSessionResponse } from "~/server/firebase-admin";
import type { Route } from "./+types/sign-in";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Sign in" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const idToken = String(formData.get("idToken") ?? "");
  if (!idToken) {
    return { error: "Missing ID token." };
  }
  return createSessionResponse(idToken, "/dashboard");
}

type Mode = "sign-in" | "sign-up";

export default function SignIn() {
  const fetcher = useFetcher();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(mode: Mode) {
    setError(null);
    try {
      const credential =
        mode === "sign-up"
          ? await createUserWithEmailAndPassword(firebaseAuth, email, password)
          : await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      fetcher.submit({ idToken }, { method: "post" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit("sign-in");
        }}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold">Sign in</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {fetcher.data && "error" in fetcher.data && (
          <p className="text-sm text-red-600">{fetcher.data.error}</p>
        )}
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border p-2"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded border p-2"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded bg-black px-4 py-2 text-white">
            Sign in
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit("sign-up")}
            className="flex-1 rounded border px-4 py-2"
          >
            Sign up
          </button>
        </div>
      </form>
    </main>
  );
}
