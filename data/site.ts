/** Facts about the directory itself (not about listed businesses — those live in the CMS). */
export const site = {
  nameEn: "Bulbula Directory",
  nameAm: "ቡልቡላ ማውጫ",
  areaEn: "Bole Bulbula, Addis Ababa",
  areaAm: "ቦሌ ቡልቡላ፣ አዲስ አበባ",
  /** Map view: centred on Bole Bulbula, east of the Bulbula river. */
  center: { lat: 8.955, lng: 38.787 },
  zoom: 14,
  /** Who runs the directory — shown on the About page and used for listing questions. */
  operator: {
    name: "Yoseph Gebeyehu",
    phone: "+251 918 292 773",
    phoneHref: "tel:+251918292773",
    email: "yosephgebeyehu73@gmail.com",
    telegram: "https://t.me/YosephGebeyehu",
    telegramHandle: "@YosephGebeyehu",
  },
} as const;

/** Lucide icon per category slug (see components/CategoryIcon.tsx). */
export type CategoryGroup = "business" | "community";
