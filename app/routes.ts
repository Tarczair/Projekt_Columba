import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("profile", "routes/profil.tsx"),
  route("dm", "routes/direct_message.tsx"),
  route("communities_settings/:communityId", "routes/comm_settings.tsx"),
  route("u/:username", "routes/user_profile.tsx"),
  route("add_community", "routes/add_community.tsx"),
  route("c/:communityName", "routes/post_area.tsx"),
] satisfies RouteConfig;
