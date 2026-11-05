import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Book Categories | BOOKVERSE" },
      { name: "description", content: "Browse BOOKVERSE by genre, language, and reading mood, from Tamil literature to fantasy and comics." },
      { property: "og:title", content: "Book Categories | BOOKVERSE" },
      { property: "og:description", content: "Choose a genre and discover your next BOOKVERSE story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="categories" />,
});