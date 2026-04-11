import type { Route } from "./+types/home";
import HomeFeed from "../components/home_feed/HomeFeed";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Columba" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <main>
      <HomeFeed />
    </main>
  );
}
