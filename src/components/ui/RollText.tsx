/** Hover label that rolls up and is replaced by a copy rising from below (styles in globals.css). */
export function RollText({ children }: { children: React.ReactNode }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  );
}
