import { Form } from "react-router";
import { SESSION_COOKIE, signInWithPassword, signUpWithPassword } from "~/server/auth";
import type { Route } from "./+types/sign-in";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Sign in" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "sign-in");

  const result =
    mode === "sign-up"
      ? await signUpWithPassword(email, password)
      : await signInWithPassword(email, password);

  if (result.error || !result.token) {
    return { error: result.error ?? "Invalid email or password." };
  }

  const headers = new Headers({ Location: "/dashboard" });
  headers.append("Set-Cookie", `${SESSION_COOKIE}=${result.token}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  return new Response(null, { status: 303, headers });
}

export default function SignIn({ actionData }: Route.ComponentProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Form method="post" className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        {actionData && "error" in actionData && (
          <p className="text-sm text-red-600">{actionData.error}</p>
        )}
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded border p-2"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            name="mode"
            value="sign-in"
            className="flex-1 rounded bg-black px-4 py-2 text-white"
          >
            Sign in
          </button>
          <button type="submit" name="mode" value="sign-up" className="flex-1 rounded border px-4 py-2">
            Sign up
          </button>
        </div>
      </Form>
    </main>
  );
}
