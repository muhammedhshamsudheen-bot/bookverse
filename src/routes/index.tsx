import { createFileRoute } from "@tanstack/react-router";
import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BOOKVERSE — One Platform. Endless Stories." },
      { name: "description", content: "Discover Tamil and English novels, free reads, comics, and independent authors on BOOKVERSE." },
      { property: "og:title", content: "BOOKVERSE — One Platform. Endless Stories." },
      { property: "og:description", content: "Discover your next favourite story with BOOKVERSE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="home" />,
});
