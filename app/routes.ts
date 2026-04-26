import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("profile", "routes/profil.tsx"),
  // Stara wersja (nie przyjmuje nic po ukośniku)
  //route("communities_settings", "routes/comm_settings.tsx"),
  // Nowa wersja (dynamiczna)
  route("communities_settings/:communityId", "routes/comm_settings.tsx"),
  route("add_community", "routes/add_community.tsx"),
  route("c/:communityName", "routes/post_area.tsx"),
] satisfies RouteConfig;
