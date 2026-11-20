import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("notes", "routes/notes.tsx"),
] satisfies RouteConfig;
