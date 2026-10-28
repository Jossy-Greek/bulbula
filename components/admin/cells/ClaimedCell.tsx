import type { DefaultCellComponentProps } from "payload";

/** "Owner" when the business has confirmed its listing; a dash otherwise. */
export default function ClaimedCell({ cellData }: DefaultCellComponentProps) {
  return cellData ? <span className="bb-pill bb-pill--claimed">✓ Owner</span> : <span className="bb-cell-none">—</span>;
}
