import { createFileRoute } from "@tanstack/react-router";

import { BookverseApp } from "@/components/bookverse/bookverse-app";

export const Route = createFileRoute("/books/$bookId")({
  head: ({ params }) => ({
    meta: [
      { title: `Book Details | BOOKVERSE` },
      { name: "description", content: "Explore book details, reading previews, and availability on BOOKVERSE." },
      { property: "og:title", content: "Book Details | BOOKVERSE" },
      { property: "og:description", content: "Explore BOOKVERSE books and reading previews." },
      { property: "og:type", content: "book" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookDetailsRoute,
});

function BookDetailsRoute() {
  const { bookId } = Route.useParams();
  return <BookverseApp page="book" bookId={bookId} />;
}