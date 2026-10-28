import { Star } from "lucide-react";

/** Five stars, filled to the nearest whole star. Decorative: say the number in text next to it. */
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} className={i <= Math.round(value) ? "fill-marigold text-marigold" : "text-border"} />
      ))}
    </span>
  );
}
