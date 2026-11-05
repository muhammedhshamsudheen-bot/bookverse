import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/authors")({
  head: () => ({
    meta: [
      { title: "Independent Authors | BOOKVERSE" },
      { name: "description", content: "Meet independent writers and discover original stories from BOOKVERSE authors." },
      { property: "og:title", content: "Independent Authors | BOOKVERSE" },
      { property: "og:description", content: "Get to know the storytellers behind BOOKVERSE books." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="authors" />,
});