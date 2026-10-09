import { cacheLife, cacheTag } from "next/cache";
import { sanity } from "./client";
import type {
  Achievement, Certificate, Education, Experience, PlaygroundItem, Post, PostCard, Profile, ProjectCard, ProjectDetail, Technology,
} from "./types";

/*
 * All content reads go through here. Each call is cached for a few minutes and tagged "sanity", so a
 * Sanity webhook hitting /api/revalidate refreshes everything at once. Failures return empty data and
 * the pages render their placeholders instead of erroring.
 */

const PUBLISHED = `!(_id in path("drafts.**"))`;

/**
 * Cache Components needs every generateStaticParams to return at least one entry. When a collection is
 * still empty, this stands in a slug that matches nothing, so the route builds and serves a 404.
 */
export const EMPTY_SLUG = "_none";
export function staticSlugs(slugs: string[]): { slug: string }[] {
  return (slugs.length ? slugs : [EMPTY_SLUG]).map((slug) => ({ slug }));
}

async function query<T>(groq: string, params: Record<string, unknown>, empty: T): Promise<T> {
  "use cache";
  cacheLife("minutes");
  cacheTag("sanity");
  try {
    return ((await sanity.fetch<T>(groq, params)) ?? empty) as T;
  } catch (err) {
    console.error("[sanity]", err instanceof Error ? err.message : err);
    return empty;
  }
}

// Documents created before v2 have no slug; derive one from the id so every project still gets a page.
const slugOf = (doc: { slug: string | null; _id: string }) => doc.slug || doc._id.replace(/^project-/, "");

const PROJECT_CARD = `
  _id, title, "slug": slug.current, "year": string::split(coalesce(date, ""), "-")[0], role, roleLocalized, summary,
  description, categories, featured, techStack, image, liveUrl, repoUrl, link, order`;

export async function getProfile(): Promise<Profile | null> {
  return query(
    `*[_id == "profile"][0]{ name, headline, oneLiner, titles, about, bio, availabilityText, availability, location,
      email, github, linkedin, instagram, aboutImage, "resumeUrl": resume.asset->url }`,
    {},
    null,
  );
}

export async function getProjects(): Promise<ProjectCard[]> {
  const rows = await query<(ProjectCard & { slug: string | null })[]>(
    `*[_type == "project" && ${PUBLISHED}] | order(coalesce(order, 999) asc, date desc) { ${PROJECT_CARD} }`,
    {},
    [],
  );
  return rows.map((p) => ({ ...p, slug: slugOf(p) }));
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  const doc = await query<(ProjectDetail & { slug: string | null }) | null>(
    `*[_type == "project" && ${PUBLISHED} && (slug.current == $slug || _id == "project-" + $slug)][0] {
      ${PROJECT_CARD}, gallery, problem, contribution, decisions, outcome, metrics }`,
    { slug },
    null,
  );
  return doc ? { ...doc, slug: slugOf(doc) } : null;
}

export async function getExperience(): Promise<Experience[]> {
  return query(
    `*[_type == "experience" && ${PUBLISHED}] | order(coalesce(endDate, "9999") desc, startDate desc) {
      _id, company, role, roleLocalized, kind, startDate, endDate, summary, description, highlights, tags, location, order }`,
    {},
    [],
  );
}

export async function getEducation(): Promise<Education[]> {
  return query(
    `*[_type == "education" && ${PUBLISHED}] | order(coalesce(order, 999) asc) {
      _id, institution, degree, startDate, endDate, expected, gpa, gpaScale, focus, courses, summary }`,
    {},
    [],
  );
}

export async function getAchievements(): Promise<Achievement[]> {
  return query(
    `*[_type == "achievement" && ${PUBLISHED}] | order(coalesce(order, 999) asc, date desc) {
      _id, title, event, organizer, date, summary, image, link, featured }`,
    {},
    [],
  );
}

export async function getCertificates(): Promise<Certificate[]> {
  return query(
    `*[_type == "certificate" && ${PUBLISHED}] | order(coalesce(order, 999) asc, issueDate desc) {
      _id, title, issuer, issueDate, credentialUrl, image }`,
    {},
    [],
  );
}

export async function getTechnologies(): Promise<Technology[]> {
  return query(`*[_type == "technology" && ${PUBLISHED}] | order(coalesce(order, 999) asc) { _id, name, iconKey, category, learning }`, {}, []);
}

export async function getPosts(language: string): Promise<PostCard[]> {
  return query(
    `*[_type == "post" && ${PUBLISHED} && language == $language] | order(publishedAt desc) {
      _id, title, "slug": slug.current, language, excerpt, publishedAt, tags, cover }`,
    { language },
    [],
  );
}

export async function getPost(slug: string): Promise<Post | null> {
  return query(
    `*[_type == "post" && ${PUBLISHED} && slug.current == $slug][0] {
      _id, title, "slug": slug.current, language, excerpt, publishedAt, tags, cover, body,
      "translation": translation->{ "slug": slug.current, language } }`,
    { slug },
    null,
  );
}

export async function getPlayground(): Promise<PlaygroundItem[]> {
  return query(
    `*[_type == "playground" && ${PUBLISHED}] | order(coalesce(order, 999) asc) {
      _id, title, "slug": slug.current, summary, status, kind, tags, link, cover }`,
    {},
    [],
  );
}
