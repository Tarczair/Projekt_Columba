import type { Route } from "./+types/home";
import { PostArea } from "../components/post_area/PostArea";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Columba" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <main>
      <PostArea />
    </main>
  );
}
