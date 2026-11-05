import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration Preview | BOOKVERSE" },
      { name: "description", content: "Preview sample BOOKVERSE catalog and submission management screens. Administration requires connected access controls." },
      { property: "og:title", content: "Administration Preview | BOOKVERSE" },
      { property: "og:description", content: "Sample administration screens for BOOKVERSE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BookverseApp page="admin" />,
});