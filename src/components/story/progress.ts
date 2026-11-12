/**
 * Scroll progress of the Home story, written by the pinned chapters and read by the 3D world every frame.
 * A plain object rather than React state: it changes on every scroll tick and nothing needs to re-render.
 *   approach  0..1 while the first chapter scrolls up to the top of the screen
 *   converge  0..1 through the first pinned chapter (lake bed -> loss landscape -> data -> laptop -> into the screen)
 *   outro     0..1 through the last pinned chapter (out of the screen -> laptop in Padang -> the globe)
 */
export const progress = { approach: 0, converge: 0, outro: 0 };

export type ChapterKind = "converge" | "outro";

/** Scroll length of each pinned chapter, in screen heights: [desktop, phone]. */
export const CHAPTER_LENGTH: Record<ChapterKind, [number, number]> = {
  converge: [3.6, 2.8],
  outro: [2.4, 1.9],
};

/** When each caption is on screen, as [in, out] in chapter progress. An out of 1 or more means it stays. */
export const CAPTION_TIMING: Record<ChapterKind, [number, number][]> = {
  converge: [
    [0.06, 0.33],
    [0.45, 0.63],
    [0.71, 0.88],
  ],
  outro: [
    [0.14, 0.44],
    [0.56, 1],
  ],
};
