import type { DefaultCellComponentProps } from "payload";

const LABELS: Record<string, string> = { pending: "Waiting", published: "Live", rejected: "Rejected" };

/** List-view status as a coloured pill: marigold waiting, teal live, red rejected. */
export default function StatusCell({ cellData }: DefaultCellComponentProps) {
  const value = typeof cellData === "string" ? cellData : "";
  if (!value) return <span className="bb-cell-none">—</span>;
  return <span className={`bb-pill bb-pill--${value}`}>{LABELS[value] ?? value}</span>;
}
