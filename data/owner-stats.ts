import type { Locale } from "./content";

/** Text of the owner's private stats page (app/(frontend)/[locale]/stats/[key]). */
export type OwnerStatsText = {
  eyebrow: string;
  featuredUntil: string; // "{d}"
  featuredOn: string;
  intro: string;
  cards: { visits: string; calls: string; directions: string; links: string };
  hints: { visits: string; calls: string; directions: string; links: string };
  up: string; // "{n} more than the 30 days before"
  down: string;
  same: string;
  shares: string; // "{n}"
  shareOnce: string;
  review: string;
  reviews: string; // "{n}"
  rating: string; // "{r}"
  noReviews: string;
  empty: string;
  growTitle: string;
  grow: string[];
  copyLink: string;
  copied: string;
  shareTelegram: string;
  viewPage: string;
  askUpdate: string;
  privateTitle: string;
  private: string;
  howTitle: string;
  how: string;
};

export const ownerStats: Record<Locale, OwnerStatsText> = {
  en: {
    eyebrow: "Your stats · last 30 days",
    featuredUntil: "Featured until {d}",
    featuredOn: "Featured",
    intro: "What people did with your listing on Bulbula Directory and its apps. Updated a few times a day.",
    cards: { visits: "Visits to your page", calls: "Calls", directions: "Directions", links: "Website & social taps" },
    hints: {
      visits: "People who opened your page",
      calls: "Taps on your phone number",
      directions: "Asked the way to you",
      links: "Opened your website, Facebook, Instagram or Telegram",
    },
    up: "▲ {n} more than the 30 days before",
    down: "▼ {n} fewer than the 30 days before",
    same: "Same as the 30 days before",
    shares: "Your page was shared {n} times",
    shareOnce: "Your page was shared once",
    review: "1 review",
    reviews: "{n} reviews",
    rating: "average {r} ★",
    noReviews: "No reviews yet",
    empty: "No visits yet this month. Sharing your page is the fastest way to start.",
    growTitle: "Get more customers",
    grow: [
      "Share your page in your Telegram channel and groups.",
      "Keep hours, phone and photos up to date: listings with photos get more taps.",
      "Ask happy customers to leave a review on your page.",
    ],
    copyLink: "Copy your page link",
    copied: "Copied ✓",
    shareTelegram: "Share on Telegram",
    viewPage: "View your page",
    askUpdate: "Ask us to update your listing",
    privateTitle: "This page is private",
    private:
      "Anyone with this link can see these numbers, so share it only with your team. If it went further, ask us and we'll make a new link; the old one stops working.",
    howTitle: "How we count",
    how: "A visit counts each person once a day. Taps are counted from the website and the Bulbula apps. We never collect visitors' names or phone numbers.",
  },
  am: {
    eyebrow: "የእርስዎ ቁጥሮች · ያለፉት 30 ቀናት",
    featuredUntil: "እስከ {d} ተለይቶ የቀረበ",
    featuredOn: "ተለይቶ የቀረበ",
    intro: "ሰዎች በቡልቡላ ማውጫ ድረ-ገጽና መተግበሪያዎች ላይ በገጽዎ ምን እንዳደረጉ። በቀን ጥቂት ጊዜ ይታደሳል።",
    cards: { visits: "ገጽዎን የጎበኙ", calls: "ጥሪዎች", directions: "አቅጣጫ የጠየቁ", links: "ድረ-ገጽና ማኅበራዊ ሚዲያ" },
    hints: {
      visits: "ገጽዎን የከፈቱ ሰዎች",
      calls: "ስልክ ቁጥርዎን የነኩ",
      directions: "ወደ እርስዎ መንገድ የጠየቁ",
      links: "ድረ-ገጽዎን፣ Facebook፣ Instagram ወይም Telegram የከፈቱ",
    },
    up: "▲ ካለፉት 30 ቀናት {n} ይበልጣል",
    down: "▼ ካለፉት 30 ቀናት {n} ያንሳል",
    same: "ካለፉት 30 ቀናት ጋር እኩል",
    shares: "ገጽዎ {n} ጊዜ ተጋርቷል",
    shareOnce: "ገጽዎ አንድ ጊዜ ተጋርቷል",
    review: "1 አስተያየት",
    reviews: "{n} አስተያየቶች",
    rating: "አማካይ {r} ★",
    noReviews: "እስካሁን አስተያየት የለም",
    empty: "በዚህ ወር እስካሁን ጎብኚ የለም። ገጽዎን ማጋራት ለመጀመር ፈጣኑ መንገድ ነው።",
    growTitle: "ተጨማሪ ደንበኞች ለማግኘት",
    grow: [
      "ገጽዎን በTelegram ቻናልዎና ቡድኖችዎ ያጋሩ።",
      "የስራ ሰዓት፣ ስልክና ፎቶዎችን ወቅታዊ ያድርጉ፤ ፎቶ ያላቸው ገጾች ብዙ ይነካሉ።",
      "የረኩ ደንበኞች በገጽዎ ላይ አስተያየት እንዲጽፉ ይጠይቁ።",
    ],
    copyLink: "የገጽዎን ሊንክ ይቅዱ",
    copied: "ተቀድቷል ✓",
    shareTelegram: "በTelegram ያጋሩ",
    viewPage: "ገጽዎን ይመልከቱ",
    askUpdate: "ገጽዎን እንድናስተካክል ይጠይቁ",
    privateTitle: "ይህ ገጽ የግል ነው",
    private: "ይህ ሊንክ ያለው ማንኛውም ሰው እነዚህን ቁጥሮች ማየት ይችላል፤ ስለዚህ ለቡድንዎ ብቻ ያጋሩት። ከዚያ አልፎ ከተሰራጨ ይንገሩን፤ አዲስ ሊንክ እንሠራለን፣ የድሮው መሥራት ያቆማል።",
    howTitle: "እንዴት እንቆጥራለን",
    how: "አንድ ሰው በቀን አንድ ጊዜ ብቻ ይቆጠራል። ንክኪዎቹ ከድረ-ገጹና ከቡልቡላ መተግበሪያዎች ይቆጠራሉ። የጎብኚዎችን ስም ወይም ስልክ ቁጥር በጭራሽ አንሰበስብም።",
  },
};
