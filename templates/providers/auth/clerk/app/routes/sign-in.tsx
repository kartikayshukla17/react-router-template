import { SignIn } from "@clerk/react-router";
import type { Route } from "./+types/sign-in";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Sign in" }];
}

/**
 * Mounted on the splat route `sign-in/*` (`app/routes.ts`) — Clerk's own
 * documented shape for a custom sign-in page in React Router framework
 * mode, since `<SignIn />` manages its own nested steps (password, OTP,
 * "sign up instead") under this one route.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignIn />
    </main>
  );
}
