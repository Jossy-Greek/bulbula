/**
 * Services and amenities a listing can show as chips. Copied from Google Maps'
 * "About" tab by scripts/import-google-details.ts (Google's many labels are
 * folded into these), and editable in the admin.
 */
export const services = {
  dineIn: { en: "Dine-in", am: "እዚያው መመገብ" },
  takeaway: { en: "Takeaway", am: "ይዞ መሄድ" },
  delivery: { en: "Delivery", am: "ማድረስ (ዴሊቨሪ)" },
  reservations: { en: "Takes reservations", am: "ቦታ ማስያዝ ይቻላል" },
  appointments: { en: "Appointments", am: "በቀጠሮ" },
  outdoorSeating: { en: "Outdoor seating", am: "የውጭ መቀመጫ" },
  wifi: { en: "Wi-Fi", am: "ዋይፋይ" },
  coffee: { en: "Coffee", am: "ቡና" },
  breakfast: { en: "Breakfast", am: "ቁርስ" },
  lunch: { en: "Lunch", am: "ምሳ" },
  dinner: { en: "Dinner", am: "እራት" },
  dessert: { en: "Desserts", am: "ጣፋጭ ምግቦች" },
  vegetarian: { en: "Vegetarian / fasting food", am: "የጾም ምግብ" },
  alcohol: { en: "Alcohol", am: "የአልኮል መጠጦች" },
  kids: { en: "Good for kids", am: "ለልጆች ተስማሚ" },
  groups: { en: "Good for groups", am: "ለቡድን ተስማሚ" },
  toilet: { en: "Toilet", am: "መጸዳጃ ቤት" },
  wheelchair: { en: "Wheelchair-accessible entrance", am: "ለዊልቸር ተደራሽ መግቢያ" },
  cards: { en: "Accepts cards", am: "ካርድ ይቀበላል" },
  mobilePay: { en: "Mobile payments", am: "በሞባይል ክፍያ" },
  freeParking: { en: "Free parking", am: "ነፃ ፓርኪንግ" },
  parking: { en: "Parking", am: "ፓርኪንግ" },
  womenOwned: { en: "Women-owned", am: "በሴቶች የሚመራ" },
} as const;

export type Service = keyof typeof services;
export const serviceKeys = Object.keys(services) as Service[];
