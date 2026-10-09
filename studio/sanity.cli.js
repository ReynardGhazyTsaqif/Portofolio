import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // `sanity deploy` -> https://reynard.sanity.studio
  deployment: {
    appId: "jjq185thsg3dpgdt0a2auw5k",
  },
});
