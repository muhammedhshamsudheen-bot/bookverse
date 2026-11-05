import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/dashboard/author")({
  head: () => ({
    meta: [
      { title: "Author Studio | BOOKVERSE" },
      { name: "description", content: "Preview the BOOKVERSE author studio for book submissions, readership, and creator tools." },
      { property: "og:title", content: "Author Studio | BOOKVERSE" },
      { property: "og:description", content: "A preview of the BOOKVERSE author space." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="author-dashboard" />,
});