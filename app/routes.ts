import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("profile", "routes/profil.tsx"),
  route("communities_settings", "routes/comm_settings.tsx"),
] satisfies RouteConfig;
