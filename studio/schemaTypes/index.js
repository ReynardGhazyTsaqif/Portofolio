import profile from "./profile";
import project from "./project";
import experience from "./experience";
import technology from "./technology";
import certificate from "./certificate";

export const schemaTypes = [profile, project, experience, technology, certificate];

export const singletonTypes = new Set(["profile"]);
