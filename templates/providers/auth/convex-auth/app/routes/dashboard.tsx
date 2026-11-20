import { Link } from "react-router";
import { requireUser } from "~/server/auth";
import type { Route } from "./+types/dashboard";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600">Signed in as {loaderData.user.email}</p>
      <Link to="/notes" className="text-blue-600 underline">
        Go to notes
      </Link>
    </main>
  );
}
