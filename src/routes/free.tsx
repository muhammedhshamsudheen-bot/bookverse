import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/free")({
  head: () => ({
    meta: [
      { title: "Free Books | BOOKVERSE" },
      { name: "description", content: "Read free stories, short reads, and selected titles from independent BOOKVERSE authors." },
      { property: "og:title", content: "Free Books | BOOKVERSE" },
      { property: "og:description", content: "Start a free read from the BOOKVERSE shelf." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="free" />,
});