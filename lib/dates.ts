/** "12 Oct 2026" / "12 ኦክቶ 2026", formatted by hand so server and browser agree. */
export function reviewDate(iso: string, months: string[]) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
