import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "create-rr-stack demo" },
    { name: "description", content: "Mongoose + Better Auth, wired end to end." },
  ];
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">create-rr-stack demo</h1>
        <p className="text-gray-600">Mongoose + Better Auth, wired end to end.</p>
        <div className="flex justify-center gap-4">
          <Link to="/sign-in" className="rounded bg-black px-4 py-2 text-white">
            Sign in
          </Link>
          <Link to="/dashboard" className="rounded border px-4 py-2">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
