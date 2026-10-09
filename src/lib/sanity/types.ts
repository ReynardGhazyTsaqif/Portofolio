export type Localized = { en?: string | null; id?: string | null } | null | undefined;
export type LocalizedBlocks = { en?: unknown[] | null; id?: unknown[] | null } | null | undefined;

export type SanityImage = {
  asset?: { _ref: string } | null;
  alt?: string | null;
  caption?: string | null;
  hotspot?: unknown;
  crop?: unknown;
};

export type Profile = {
  name: string;
  headline: Localized;
  oneLiner: Localized;
  titles: Localized[] | null;
  about: Localized;
  bio: string | null;
  availabilityText: Localized;
  availability: string | null;
  location: string | null;
  email: string | null;
  github: string | null;
  linkedin: string | null;
  instagram: string | null;
  aboutImage: SanityImage | null;
  resumeUrl: string | null;
};

export type ProjectCategory = "web" | "ai" | "data";

export type ProjectCard = {
  _id: string;
  title: string;
  slug: string;
  year: string;
  role: string | null;
  roleLocalized: Localized;
  summary: Localized;
  description: string | null;
  categories: ProjectCategory[] | null;
  featured: boolean | null;
  techStack: string[] | null;
  image: SanityImage | null;
  liveUrl: string | null;
  repoUrl: string | null;
  link: string | null;
  order: number | null;
};

export type ProjectDetail = ProjectCard & {
  gallery: SanityImage[] | null;
  problem: Localized;
  contribution: Localized;
  decisions: LocalizedBlocks;
  outcome: Localized;
  metrics: { value: string; label: Localized }[] | null;
};

export type ExperienceKind = "work" | "internship" | "lab" | "organisation" | "volunteer";

export type Experience = {
  _id: string;
  company: string;
  role: string;
  roleLocalized: Localized;
  kind: ExperienceKind | null;
  startDate: string | null;
  endDate: string | null;
  summary: Localized;
  description: string | null;
  highlights: Localized[] | null;
  tags: string[] | null;
  location: string | null;
  order: number | null;
};

export type Education = {
  _id: string;
  institution: string;
  degree: Localized;
  startDate: string | null;
  endDate: string | null;
  expected: Localized;
  gpa: string | null;
  gpaScale: string | null;
  focus: Localized;
  courses: Localized[] | null;
  summary: Localized;
};

export type Achievement = {
  _id: string;
  title: Localized;
  event: string | null;
  organizer: string | null;
  date: string | null;
  summary: Localized;
  image: SanityImage | null;
  link: string | null;
  featured: boolean | null;
};

export type Certificate = {
  _id: string;
  title: string;
  issuer: string | null;
  issueDate: string | null;
  credentialUrl: string | null;
  image: SanityImage | null;
};

export type Technology = {
  _id: string;
  name: string;
  iconKey: string | null;
  category: "web" | "ai" | "data" | "tools" | null;
  learning: boolean | null;
};

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  language: "en" | "id";
  excerpt: string | null;
  publishedAt: string;
  tags: string[] | null;
  cover: SanityImage | null;
};

export type Post = PostCard & { body: unknown[] | null; translation: { slug: string; language: "en" | "id" } | null };

export type PlaygroundItem = {
  _id: string;
  title: Localized;
  slug: string;
  summary: Localized;
  status: "live" | "wip" | "idea" | null;
  kind: string | null;
  tags: string[] | null;
  link: string | null;
  cover: SanityImage | null;
};
