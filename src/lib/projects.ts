const P = "/img/projects";

export type Project = {
  slug: string;
  title: string;
  blurb: string;
  type: string;
  location: string;
  status: string;
  images: string[];
};

const set = (name: string, n: number) => Array.from({ length: n }, (_, i) => `${P}/${name}-${i + 1}.jpg`);

export type Category = "All" | "Residential" | "Apartments" | "Commercial" | "Hospitality";
export const CATEGORIES: Category[] = ["All", "Residential", "Apartments", "Commercial", "Hospitality"];

export function categoryOf(p: Project): Exclude<Category, "All"> {
  const t = p.type.toLowerCase();
  if (t.startsWith("resid") || t.includes("townhouse")) return "Residential";
  if (t.includes("apartment")) return "Apartments";
  if (t.includes("hospitality")) return "Hospitality";
  return "Commercial";
}

export const projects: Project[] = [
  {
    slug: "kurb-food-court",
    title: "KURB Food Court",
    blurb: "From render to rooftop. A container-style food court with kiosks, a terrace and string lights for the night crowd.",
    type: "Commercial",
    location: "Kampala",
    status: "Completed 2025",
    images: set("kurb", 4),
  },
  {
    slug: "pool-villa",
    title: "Pool Villa",
    blurb: "A family villa with a terraced pool amphitheatre carved into the hillside. Structure complete, finishes under way.",
    type: "Residence",
    location: "Wakiso",
    status: "Under construction",
    images: set("pool-villa", 4),
  },
  {
    slug: "crescent-apartments",
    title: "Crescent Apartments",
    blurb: "Curves in glass and timber. A stepped apartment tower wrapped around a pool court.",
    type: "Apartments",
    location: "Kampala",
    status: "In design",
    images: set("crescent", 6),
  },
  {
    slug: "mukwano-offices",
    title: "Mukwano Enterprises Offices",
    blurb: "Brick, steel and shade. A corporate headquarters with a covered arrival court.",
    type: "Offices",
    location: "Kampala",
    status: "In design",
    images: set("mukwano", 2),
  },
  {
    slug: "waterfall-residence",
    title: "Waterfall Residence",
    blurb: "Stone cladding, timber screens and a cascading water wall at the entrance.",
    type: "Residence",
    location: "Uganda",
    status: "In design",
    images: set("waterfall", 2),
  },
  {
    slug: "contemporary-villas",
    title: "Contemporary Villas",
    blurb: "A series of private homes in glass, stone and shadow. Each one shaped around its plot and its view.",
    type: "Residences",
    location: "Uganda",
    status: "Various",
    images: set("villa", 6),
  },
  {
    slug: "lakeside-resort",
    title: "Lakeside Resort & Lodge",
    blurb: "Low timber pavilions, a pool court and a gabled stone lodge for the dry season.",
    type: "Hospitality",
    location: "Uganda",
    status: "In design",
    images: set("resort", 2),
  },
  {
    slug: "corporate-office",
    title: "Corporate Office Block",
    blurb: "A curved glass office building with a rooftop terrace and landscaped forecourt.",
    type: "Offices",
    location: "Kampala",
    status: "In design",
    images: set("office", 2),
  },
  {
    slug: "commercial-plaza",
    title: "Commercial Plaza",
    blurb: "Shops below, offices above, loading at the back. A working building for a busy road.",
    type: "Commercial",
    location: "Uganda",
    status: "In design",
    images: set("plaza", 3),
  },
  {
    slug: "terraced-townhouses",
    title: "Terraced Townhouses",
    blurb: "Rhythm in stone and dark render. A row of homes, each with its own terrace.",
    type: "Townhouses",
    location: "Uganda",
    status: "In design",
    images: set("terraced", 2),
  },
  {
    slug: "bougainvillea-townhouses",
    title: "Bougainvillea Townhouses",
    blurb: "Two-storey homes in brick and timber, finished and planted.",
    type: "Townhouses",
    location: "Kampala",
    status: "Completed 2024",
    images: set("bougainvillea", 1),
  },
  {
    slug: "apartment-estate",
    title: "Apartment Estate",
    blurb: "Mid-rise blocks with deep balconies and white frames, set in shared gardens.",
    type: "Apartments",
    location: "Uganda",
    status: "In design",
    images: set("estate", 3),
  },
  {
    slug: "hillside-apartments",
    title: "Hillside Apartments",
    blurb: "Brick and perforated screens. Walk-up apartments stepping down the slope.",
    type: "Apartments",
    location: "Kampala",
    status: "In design",
    images: set("hillside", 3),
  },
  {
    slug: "apartment-tower",
    title: "Apartment Tower",
    blurb: "Seven storeys over a colonnaded ground floor. Night render.",
    type: "Apartments",
    location: "Kampala",
    status: "In design",
    images: set("tower", 1),
  },
  {
    slug: "mediterranean-villa",
    title: "Mediterranean Villa",
    blurb: "Terracotta roofs, arches and a fountain court. A family villa in the hills.",
    type: "Residence",
    location: "Masaka",
    status: "In design",
    images: set("mediterranean", 1),
  },
  {
    slug: "college-hall",
    title: "College Hall",
    blurb: "A long timber-lattice hall with a landscaped forecourt for a campus.",
    type: "Institutional",
    location: "Uganda",
    status: "In design",
    images: set("college", 1),
  },
];
