Fonts served by the site itself (next/font/local in `app/(frontend)/[locale]/layout.tsx`).

| File | Font | Subset | Source |
|---|---|---|---|
| `inter-latin.woff2` | Inter (variable, 100–900) | latin | Google Fonts, v20 |
| `jakarta-latin.woff2` | Plus Jakarta Sans (variable, 200–800) | latin | Google Fonts, v12 |
| `noto-ethiopic-400.woff2`, `-700.woff2` | Noto Sans Ethiopic, static 400 and 700 | ethiopic | cut from the Google Fonts v50 variable file |
| `og/*.ttf` | Jakarta 800, Inter 500, Noto Sans Ethiopic 700 | as above | the same, as TTF for link-preview images (`next/og` can't read woff2) |

All are under the SIL Open Font License 1.1, which allows bundling them with the site.
Downloaded 2026-11-05, when `next/font/google` stopped building. The static and TTF cuts
were made on 2026-11-10 with fonttools:

```sh
fonttools varLib.instancer noto-ethiopic.woff2 wght=700 -o eth700.ttf
pyftsubset eth700.ttf --unicodes="U+1200-139F,U+2D80-2DDF,U+AB00-AB2F,U+0020-007E" \
  --layout-features='*' --flavor=woff2 --output-file=noto-ethiopic-700.woff2
```
