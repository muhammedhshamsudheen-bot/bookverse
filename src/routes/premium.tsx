import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "BOOKVERSE Plus Membership" },
      { name: "description", content: "Compare BOOKVERSE Plus monthly, quarterly, half-yearly, and yearly membership plans." },
      { property: "og:title", content: "BOOKVERSE Plus Membership" },
      { property: "og:description", content: "Make more room for stories with BOOKVERSE Plus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="premium" />,
});