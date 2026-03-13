import type { Route } from "./+types/home";
import { MainView } from "../MainView";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Columba" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <MainView />;
}
