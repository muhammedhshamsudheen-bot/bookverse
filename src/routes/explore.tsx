import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Books | BOOKVERSE" },
      { name: "description", content: "Explore novels, Tamil literature, short stories, mysteries, comics, and more on BOOKVERSE." },
      { property: "og:title", content: "Explore Books | BOOKVERSE" },
      { property: "og:description", content: "Find your next read across languages and genres on BOOKVERSE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExploreRoute,
});

function ExploreRoute() {
  return <BookverseApp page="explore" />;
}