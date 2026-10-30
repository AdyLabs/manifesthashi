import list from "../paintings.json";

export type Category = "figure" | "abstract";

export type Piece = {
  id: string;
  title: string;
  category: Category;
  medium: string;
  tag: string;
  status: "available" | "wip";
  price: string;
  src: string;
  file: string;
  alt: string;
};

/*
  The shop reads paintings.json (repo root) and the photos in art/. To add a painting, drop the
  photo in art/ and add an entry to paintings.json; README.md walks through it.
  scripts/check-paintings.mjs validates both before every deploy, so an entry that fails here
  never reaches the live site. Titles and prices are placeholders until Sal confirms them.
*/
const photos = import.meta.glob<string>("../art/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  query: "?url",
  import: "default",
});

type Entry = Omit<Piece, "src" | "file"> & { image: string };

export const pieces: Piece[] = (list as Entry[]).flatMap(({ image, ...rest }) => {
  const src = photos[`../art/${image}`];
  if (!src) {
    console.warn(`paintings.json: no photo named "${image}" in art/, skipping "${rest.title}".`);
    return [];
  }
  return [{ ...rest, src, file: image }];
});

export const tiers = [
  { name: "Small", size: "Up to 8 × 10 in" },
  { name: "Medium", size: "Up to 16 × 20 in" },
  { name: "Large", size: "18 × 24 in and up" },
];

export const steps = [
  "Send the request with your idea and any reference photos.",
  "Sal replies with a price and a timeline.",
  "A deposit holds your spot in the queue.",
  "You approve a sketch before any paint goes down.",
  "The finished piece ships to you or gets picked up.",
];

export const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem(k); return v === null ? d : (JSON.parse(v) as T); } catch { return d; }
  },
  set(k: string, v: unknown) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: fine */ }
  },
};
