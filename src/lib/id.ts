/** uuid v4 — CLAUDE.md §7 proíbe auto-increment. */
export function newId(): string {
  return crypto.randomUUID()
}
