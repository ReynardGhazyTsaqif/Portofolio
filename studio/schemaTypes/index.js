import profile from "./profile";
import project from "./project";
import experience from "./experience";
import technology from "./technology";
import certificate from "./certificate";
import education from "./education";
import achievement from "./achievement";
import post from "./post";
import playground from "./playground";
import { localeString, localeText, localeBlocks, blocks } from "./objects/locale";

export const schemaTypes = [
  localeString,
  localeText,
  localeBlocks,
  blocks,
  profile,
  project,
  experience,
  education,
  achievement,
  certificate,
  technology,
  post,
  playground,
];

export const singletonTypes = new Set(["profile"]);
