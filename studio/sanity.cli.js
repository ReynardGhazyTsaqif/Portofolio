import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // Isi agar `sanity deploy` tidak bertanya nama host setiap kali,
  // mis. "reynard-portfolio" -> https://reynard-portfolio.sanity.studio
  // studioHost: "",
});
