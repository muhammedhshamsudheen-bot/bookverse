import monsoonCover from "@/assets/book-cover-monsoon.jpg";
import forestCover from "@/assets/book-cover-forest.jpg";
import orbitCover from "@/assets/book-cover-orbit.jpg";
import comicCover from "@/assets/book-cover-comic.jpg";

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  language: "English" | "தமிழ்";
  price: number;
  rating: number;
  reads: string;
  pages: number;
  access: "Free" | "Premium" | "Buy";
  cover: string;
  description: string;
  published: string;
};

export const books: [Book, ...Book[]] = [
  {
    id: "monsoon-letters",
    title: "Letters from the Monsoon",
    author: "Ananya Krishnan",
    category: "Literary fiction",
    language: "English",
    price: 49,
    rating: 4.9,
    reads: "12.8k",
    pages: 248,
    access: "Premium",
    cover: monsoonCover,
    description: "A return to the rain-washed streets of home becomes a tender journey through family, memory, and everything left unsaid.",
    published: "2026-03-12",
  },
  {
    id: "where-forest-ends",
    title: "Where the Forest Ends",
    author: "Mira Venkatesh",
    category: "Mystery",
    language: "English",
    price: 39,
    rating: 4.8,
    reads: "9.2k",
    pages: 312,
    access: "Buy",
    cover: forestCover,
    description: "A missing hiker, a forgotten village, and a forest that seems to remember every secret buried beneath its roots.",
    published: "2026-02-28",
  },
  {
    id: "orbit-of-us",
    title: "The Orbit of Us",
    author: "Dev Malhotra",
    category: "Science fiction",
    language: "English",
    price: 0,
    rating: 4.7,
    reads: "18.1k",
    pages: 96,
    access: "Free",
    cover: orbitCover,
    description: "Two strangers on opposite sides of a quiet space station discover that the smallest signals can change a universe.",
    published: "2026-04-06",
  },
  {
    id: "city-of-small-stars",
    title: "City of Small Stars",
    author: "Rhea Thomas",
    category: "Graphic novel",
    language: "English",
    price: 29,
    rating: 4.8,
    reads: "7.6k",
    pages: 184,
    access: "Buy",
    cover: comicCover,
    description: "An artist finds her way back to the city she left behind, one rooftop garden and one unlikely friendship at a time.",
    published: "2026-04-18",
  },
  {
    id: "nizhal-paadhai",
    title: "நிழல் பாதை",
    author: "கார்த்திக் ராமன்",
    category: "Tamil literature",
    language: "தமிழ்",
    price: 19,
    rating: 4.9,
    reads: "21.4k",
    pages: 168,
    access: "Free",
    cover: monsoonCover,
    description: "ஒரு சிறிய ஊரின் பழைய கதைகளையும் புதிய கனவுகளையும் இணைக்கும் மனதைத் தொடும் தமிழ் சிறுகதைத் தொகுப்பு.",
    published: "2026-03-30",
  },
  {
    id: "paper-moons",
    title: "Paper Moons",
    author: "Ishita Rao",
    category: "Romance",
    language: "English",
    price: 79,
    rating: 4.6,
    reads: "6.3k",
    pages: 286,
    access: "Premium",
    cover: orbitCover,
    description: "A slow-burn romance about second chances, midnight trains, and the handwritten maps we make for one another.",
    published: "2026-04-22",
  },
  {
    id: "kadal-vannam",
    title: "கடல் வண்ணம்",
    author: "மீனா சுப்ரமணியம்",
    category: "Tamil novels",
    language: "தமிழ்",
    price: 39,
    rating: 4.8,
    reads: "11.2k",
    pages: 224,
    access: "Buy",
    cover: forestCover,
    description: "கடலோரக் கிராமத்தில் மூன்று தலைமுறைகளின் வாழ்வையும் கனவுகளையும் சொல்லும் அழகான நாவல்.",
    published: "2026-04-14",
  },
  {
    id: "little-comet-club",
    title: "The Little Comet Club",
    author: "Arjun Iyer",
    category: "Comics",
    language: "English",
    price: 0,
    rating: 4.7,
    reads: "5.9k",
    pages: 72,
    access: "Free",
    cover: comicCover,
    description: "Four curious kids, one very odd telescope, and a summer full of cosmic surprises.",
    published: "2026-04-25",
  },
];

export const membershipPlans = [
  { name: "Monthly", duration: "1 month", price: 79 },
  { name: "Quarterly", duration: "3 months", price: 199 },
  { name: "Half-yearly", duration: "6 months", price: 399 },
  { name: "Yearly", duration: "12 months", price: 699 },
] as const;

export const bookById = (id: string) => books.find((book) => book.id === id) ?? books[0];

export function searchBooks(query: string, items: Book[] = books) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return items;
  return items.filter((book) =>
    [book.title, book.author, book.category, book.language].some((value) =>
      value.toLocaleLowerCase().includes(normalized),
    ),
  );
}