export const site = {
  name: "Reynard Ghazy Tsaqif",
  url: "https://reynarddev.vercel.app",
  email: "reynard.gtsaqif@gmail.com",
  cv: "/CV_Reynard_Ghazy_Tsaqif.pdf",
  timeZone: "Asia/Jakarta",
  socials: [
    { label: "LinkedIn", href: "https://linkedin.com/in/reynard-ghazy-tsaqif" },
    { label: "GitHub", href: "https://github.com/ReynardGhazyTsaqif" },
    { label: "Instagram", href: "https://instagram.com/reynard_ghazy" },
  ],
} as const;

export const navItems = [
  { key: "home", path: "/" },
  { key: "about", path: "/about" },
  { key: "work", path: "/work" },
  { key: "playground", path: "/playground" },
  { key: "notes", path: "/notes" },
  { key: "contact", path: "/contact" },
] as const;
