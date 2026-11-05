import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "My Reading Room | BOOKVERSE" },
      { name: "description", content: "A preview of your BOOKVERSE reading room, library, and reading activity." },
      { property: "og:title", content: "My Reading Room | BOOKVERSE" },
      { property: "og:description", content: "Your BOOKVERSE reading room preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="customer" />,
});