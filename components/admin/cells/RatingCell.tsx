import type { DefaultCellComponentProps } from "payload";

/** A review's rating as five stars. */
export default function RatingCell({ cellData }: DefaultCellComponentProps) {
  const n = Math.round(Number(cellData) || 0);
  return (
    <span className="bb-cell-stars" aria-label={`${n} of 5 stars`}>
      {"★".repeat(n)}
      <span>{"★".repeat(5 - n)}</span>
    </span>
  );
}
