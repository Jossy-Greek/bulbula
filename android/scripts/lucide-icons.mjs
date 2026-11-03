// Lucide icons (the website's set) → Android vector drawables, so the app and site share one icon language.
// From the repo root: node android/scripts/lucide-icons.mjs node_modules/lucide-react/dist/esm/icons android/app/src/main/res/drawable coffee house:home …
import fs from "node:fs";
import path from "node:path";
const [dir, out, ...names] = process.argv.slice(2);
const n = (v) => Number(v);
function toPath([tag, a]) {
  switch (tag) {
    case "path": return a.d;
    case "line": return `M${a.x1} ${a.y1}L${a.x2} ${a.y2}`;
    case "polyline": case "polygon": {
      const p = a.points.trim().split(/[\s,]+/).map(Number); let d = `M${p[0]} ${p[1]}`;
      for (let i = 2; i < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`; return tag === "polygon" ? d + "Z" : d;
    }
    case "circle": { const [cx, cy, r] = [n(a.cx), n(a.cy), n(a.r)]; return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`; }
    case "ellipse": { const [cx, cy, rx, ry] = [n(a.cx), n(a.cy), n(a.rx), n(a.ry)]; return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`; }
    case "rect": {
      const [x, y, w, h] = [n(a.x ?? 0), n(a.y ?? 0), n(a.width), n(a.height)]; const r = Math.min(n(a.rx ?? a.ry ?? 0), w / 2, h / 2);
      if (!r) return `M${x} ${y}h${w}v${h}h${-w}Z`;
      return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
    }
    default: throw new Error(`unsupported ${tag}`);
  }
}
for (const spec of names) {
  const [name, alias] = spec.split(":");
  const { __iconData } = await import(path.resolve(dir, name + ".mjs"));
  const node = __iconData.node;
  const paths = node.map((el) => `    <path android:pathData="${toPath(el)}" android:strokeColor="#FF000000" android:strokeWidth="2" android:strokeLineCap="round" android:strokeLineJoin="round" />`).join("\n");
  const file = `<!-- Lucide "${name}" (ISC licence, see LICENSE-lucide.txt), the website's icon set. -->\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">\n${paths}\n</vector>\n`;
  fs.writeFileSync(path.join(out, `ic_${(alias ?? name).replace(/-/g, "_")}.xml`), file);
}
console.log("wrote", names.length);
