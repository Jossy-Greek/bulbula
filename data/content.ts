export const locales = ["en", "am"] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

type Link = { label: string; href: string };
export const googleAmenities = [
  "hasDineIn", "hasTakeout", "hasDelivery", "isReservable", "hasOutdoorSeating",
  "servesCoffee", "servesBreakfast", "servesLunch", "servesDinner", "servesDessert", "servesVegetarianFood",
  "isGoodForChildren", "isGoodForGroups", "hasRestroom", "wheelchairEntrance", "acceptsCards", "freeParking",
] as const;
export type GoogleAmenity = (typeof googleAmenities)[number];

export type Content = {
  locale: Locale;
  meta: { title: string; description: string };
  ui: {
    openMenu: string;
    closeMenu: string;
    language: string;
    search: string;
    searchButton: string;
    searchShort: string;
    all: string;
    /** "{n}" is replaced with the count. */
    results: string;
    resultOne: string;
    noResults: string;
    unclaimed: string;
    unclaimedHint: string;
    unconfirmed: string;
    unconfirmedHint: string;
    verified: string;
    call: string;
    website: string;
    directions: string;
    openInMaps: string;
    viewOnMap: string;
    details: string;
    hours: string;
    phone: string;
    address: string;
    socials: string;
    claim: string;
    claimHint: string;
    generated: string;
    osmCredit: string;
    back: string;
    businesses: string;
    community: string;
    openNow: string;
    closedNow: string;
    /** "{t}" = time, "{d}" = day. */
    until: string;
    opensToday: string;
    opensDay: string;
    open24: string;
    nearMe: string;
    locating: string;
    noLocation: string;
    /** "{d}" = distance. */
    away: string;
    showMap: string;
    showList: string;
    share: string;
    copied: string;
    copyLink: string;
    showMore: string;
    nearby: string;
    googleTitle: string;
    /** "{n}" = number of reviews. */
    googleReviews: string;
    readOnGoogle: string;
    readMore: string;
    showLess: string;
    fromGoogle: string;
    googleClosedPermanently: string;
    googleClosedTemporarily: string;
    googlePhotos: string;
    /** "{name}" = photographer. */
    googlePhotoBy: string;
    googleServices: string;
    googlePrice: Record<"FREE" | "INEXPENSIVE" | "MODERATE" | "EXPENSIVE" | "VERY_EXPENSIVE", string>;
    googleAmenities: Record<GoogleAmenity, string>;
    /** "{c}" = category name. */
    allInCategory: string;
    /** "{n}" shown of "{t}". */
    showing: string;
    sortRecommended: string;
    sortAZ: string;
    clearFilters: string;
    addIt: string;
    source: { osm: string; owner: string; admin: string };
    suggestEdit: string;
    days: string[];
  };
  nav: Link[];
  cta: Link;
  hero: { eyebrow: string; title: string; body: string; stats: { businesses: string; categories: string } };
  categoriesSection: { eyebrow: string; title: string };
  mapSection: { eyebrow: string; title: string; body: string };
  newest: { eyebrow: string; title: string; link: Link };
  ownerBand: { title: string; body: string; button: string };
  listPage: { eyebrow: string; title: string; intro: string };
  addPage: {
    eyebrow: string;
    title: string;
    intro: string;
    claimingTitle: string;
    sections: { business: string; contact: string; about: string; you: string };
    fields: {
      nameEn: string;
      nameAm: string;
      category: string;
      chooseCategory: string;
      landmark: string;
      landmarkHint: string;
      mapsLink: string;
      mapsLinkHint: string;
      phone: string;
      website: string;
      facebook: string;
      instagram: string;
      telegram: string;
      hours: string;
      hoursHint: string;
      descriptionEn: string;
      descriptionAm: string;
      yourName: string;
      yourPhone: string;
      relationship: string;
      owner: string;
      manager: string;
      customer: string;
      consent: string;
    };
    submit: string;
    sending: string;
    successTitle: string;
    successBody: string;
    another: string;
    errors: { required: string; contact: string; consent: string; failed: string };
  };
  aboutPage: { eyebrow: string; title: string; intro: string; sections: { title: string; body: string }[]; contactTitle: string; privacy: string };
  footer: { blurb: string; explore: string; contact: string; rights: string };
  reviews: {
    title: string;
    /** "{n}" = number of reviews. */
    count: string;
    one: string;
    none: string;
    write: string;
    yourRating: string;
    /** Labels for 1 to 5 stars. */
    stars: string[];
    name: string;
    text: string;
    textHint: string;
    submit: string;
    sending: string;
    thanks: string;
    moderated: string;
    /** "{n}" = number of reviews. */
    showAll: string;
    latestEyebrow: string;
    latestTitle: string;
    months: string[];
    errors: { rating: string; name: string; links: string; already: string; failed: string };
  };
};

const en: Content = {
  locale: "en",
  meta: {
    title: "Bulbula Directory — businesses in Bole Bulbula, Addis Ababa",
    description: "Find cafés, shops, pharmacies, banks, services and community places in Bole Bulbula, Addis Ababa — with contacts, hours, websites and map.",
  },
  ui: {
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    search: "Search businesses, e.g. bakery, bank, Tukiya…",
    searchButton: "Search",
    searchShort: "Bakery, bank, Tukiya…",
    all: "All",
    results: "{n} places",
    resultOne: "1 place",
    noResults: "Nothing matches yet. Know a place that should be here? Add it.",
    unclaimed: "Unclaimed",
    unclaimedHint: "From public map data — not yet confirmed by the business.",
    unconfirmed: "Not yet confirmed",
    unconfirmedHint: "Found on Google Maps and not checked yet — call ahead or open it in Google Maps for details. Is this your business? Claim it to add your phone and hours.",
    verified: "Confirmed by owner",
    call: "Call",
    website: "Website",
    directions: "Directions",
    openInMaps: "Open in Google Maps",
    viewOnMap: "View on map",
    details: "Details",
    hours: "Hours",
    phone: "Phone",
    address: "Where",
    socials: "Online",
    claim: "Is this your business? Claim it",
    claimHint: "Add your description, photos, hours and contacts — free.",
    generated: "Summary built from the listing's details. The owner can replace it with their own description.",
    osmCredit: "Location data © OpenStreetMap contributors",
    back: "All businesses",
    businesses: "Businesses",
    community: "Community",
    openNow: "Open now",
    closedNow: "Closed",
    until: "until {t}",
    opensToday: "opens {t}",
    opensDay: "opens {d} {t}",
    open24: "Open 24 hours",
    nearMe: "Near me",
    locating: "Finding you…",
    noLocation: "Couldn't get your location",
    away: "{d} away",
    showMap: "Map",
    showList: "List",
    share: "Share",
    copied: "Link copied",
    copyLink: "Copy link",
    showMore: "Show more",
    nearby: "Nearby",
    googleTitle: "On Google Maps",
    googleReviews: "{n} Google reviews",
    readOnGoogle: "All reviews on Google Maps",
    readMore: "Read more",
    showLess: "Show less",
    fromGoogle: "Rating, reviews and details from Google Maps, shown live. Reviews are by Google users.",
    googleClosedPermanently: "Google Maps lists this place as permanently closed. Call before you go.",
    googleClosedTemporarily: "Google Maps lists this place as temporarily closed.",
    googlePhotos: "Photos",
    googlePhotoBy: "Photo: {name}",
    googleServices: "Services",
    googlePrice: { FREE: "Free", INEXPENSIVE: "Inexpensive", MODERATE: "Moderate prices", EXPENSIVE: "Expensive", VERY_EXPENSIVE: "Very expensive" },
    googleAmenities: {
      hasDineIn: "Dine-in",
      hasTakeout: "Takeaway",
      hasDelivery: "Delivery",
      isReservable: "Takes reservations",
      hasOutdoorSeating: "Outdoor seating",
      servesCoffee: "Coffee",
      servesBreakfast: "Breakfast",
      servesLunch: "Lunch",
      servesDinner: "Dinner",
      servesDessert: "Desserts",
      servesVegetarianFood: "Vegetarian food",
      isGoodForChildren: "Good for kids",
      isGoodForGroups: "Good for groups",
      hasRestroom: "Restroom",
      wheelchairEntrance: "Wheelchair-accessible entrance",
      acceptsCards: "Accepts cards",
      freeParking: "Free parking",
    },
    allInCategory: "All {c}",
    showing: "Showing {n} of {t}",
    sortRecommended: "Recommended",
    sortAZ: "A–Z",
    clearFilters: "Clear filters",
    addIt: "Add a place",
    source: { osm: "Source: OpenStreetMap", owner: "Added by the business", admin: "Added by Bulbula Directory" },
    suggestEdit: "Suggest a correction",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Businesses", href: "/businesses" },
    { label: "About", href: "/about" },
  ],
  cta: { label: "Add your business", href: "/add" },
  hero: {
    eyebrow: "Bole Bulbula · Addis Ababa",
    title: "Everything in Bulbula, in one place.",
    body: "Cafés, bakeries, pharmacies, banks, shops and services in Bole Bulbula — with phone numbers, hours, websites and directions.",
    stats: { businesses: "places listed", categories: "categories" },
  },
  categoriesSection: { eyebrow: "Browse", title: "What are you looking for?" },
  mapSection: { eyebrow: "On the map", title: "Bulbula at a glance", body: "Every listing with a known location. Tap a pin for details." },
  newest: { eyebrow: "In the directory", title: "Places in Bulbula", link: { label: "See all", href: "/businesses" } },
  ownerBand: {
    title: "Own a business in Bulbula?",
    body: "Add it for free, or claim your listing to add a description, photos, hours and your website. We review every submission before it goes live.",
    button: "Add your business",
  },
  listPage: { eyebrow: "Directory", title: "Businesses in Bole Bulbula", intro: "Search by name or filter by category." },
  addPage: {
    eyebrow: "Free listing",
    title: "Add your business",
    intro: "Tell us about your business. We check every submission and publish it within a few days.",
    claimingTitle: "Claiming",
    sections: { business: "Your business", contact: "How customers reach you", about: "Describe it", you: "About you" },
    fields: {
      nameEn: "Business name (English)",
      nameAm: "Business name (Amharic, optional)",
      category: "Category",
      chooseCategory: "Choose a category",
      landmark: "Where in Bulbula?",
      landmarkHint: "A landmark people know, e.g. “near 93 Mazoriya” or “opposite St George church”.",
      mapsLink: "Google Maps link (optional)",
      mapsLinkHint: "Open your place in Google Maps → Share → Copy link.",
      phone: "Phone",
      website: "Website",
      facebook: "Facebook",
      instagram: "Instagram",
      telegram: "Telegram",
      hours: "Opening hours",
      hoursHint: "e.g. Mon–Sat 8:00–20:00",
      descriptionEn: "Description (English)",
      descriptionAm: "Description (Amharic, optional)",
      yourName: "Your name",
      yourPhone: "Your phone (not published)",
      relationship: "You are the…",
      owner: "Owner",
      manager: "Manager / staff",
      customer: "Customer",
      consent: "I confirm the details are correct and may be published.",
    },
    submit: "Send for review",
    sending: "Sending…",
    successTitle: "Thank you!",
    successBody: "We received your submission and will review it soon. We may call you to confirm.",
    another: "Add another business",
    errors: {
      required: "Please fill in the business name, category and your name and phone.",
      contact: "Add at least one way to reach the business: phone, website or a social link.",
      consent: "Please confirm the details may be published.",
      failed: "Sorry, something went wrong. Please try again.",
    },
  },
  aboutPage: {
    eyebrow: "About",
    title: "A directory for Bole Bulbula",
    intro: "Bulbula Directory helps people find the businesses and services around them — and helps local businesses be found.",
    sections: [
      {
        title: "Where the listings come from",
        body: "The first listings come from OpenStreetMap, a free map made by volunteers. Those are marked “Unclaimed” until the business confirms them. Everything else is added by business owners and reviewed by us.",
      },
      {
        title: "Free for businesses",
        body: "Listing a business is free. Owners can add a description in English and Amharic, a photo, opening hours, phone, website and social links, and update them at any time.",
      },
      {
        title: "Which area",
        body: "The directory covers Bole Bulbula, east of the Bulbula river — around Bole 17/19/20, 93 Mazoriya, the Bulbula condominiums and the road to Bole Michael.",
      },
    ],
    contactTitle: "Questions or corrections",
    privacy: "We count visits to improve the directory — anonymously: no cookies, no accounts, no IP addresses stored.",
  },
  footer: {
    blurb: "Businesses, services and community places in Bole Bulbula, Addis Ababa.",
    explore: "Explore",
    contact: "Contact",
    rights: "Map data © OpenStreetMap contributors.",
  },
  reviews: {
    title: "Reviews",
    count: "{n} reviews",
    one: "1 review",
    none: "No reviews yet. Been here? Tell your neighbours how it was.",
    write: "Write a review",
    yourRating: "Your rating",
    stars: ["Poor", "Fair", "Good", "Very good", "Excellent"],
    name: "Your first name",
    text: "What was it like? (optional)",
    textHint: "Be fair and specific: service, prices, opening times. No links or phone numbers.",
    submit: "Send review",
    sending: "Sending…",
    thanks: "Thank you! Your review will appear once we've checked it.",
    moderated: "Reviews are by visitors and checked before they appear.",
    showAll: "Show all {n} reviews",
    latestEyebrow: "From neighbours",
    latestTitle: "Latest reviews",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    errors: {
      rating: "Choose a star rating.",
      name: "Add your first name.",
      links: "Please leave out links, usernames and phone numbers.",
      already: "You've already reviewed this place today.",
      failed: "Something went wrong. Please try again.",
    },
  },
};

/* Amharic: draft, to be reviewed. */
const am: Content = {
  locale: "am",
  meta: {
    title: "ቡልቡላ ማውጫ — በቦሌ ቡልቡላ ያሉ ንግዶች",
    description: "በቦሌ ቡልቡላ ያሉ ካፌዎች፣ ሱቆች፣ ፋርማሲዎች፣ ባንኮች፣ አገልግሎቶችና የማህበረሰብ ቦታዎች — ከስልክ፣ ሰዓት፣ ድረ ገጽና ካርታ ጋር።",
  },
  ui: {
    openMenu: "ማውጫ ክፈት",
    closeMenu: "ማውጫ ዝጋ",
    language: "ቋንቋ",
    search: "ንግድ ይፈልጉ፣ ለምሳሌ ዳቦ ቤት፣ ባንክ፣ ቱኪያ…",
    searchButton: "ፈልግ",
    searchShort: "ዳቦ ቤት፣ ባንክ፣ ቱኪያ…",
    all: "ሁሉም",
    results: "{n} ቦታዎች",
    resultOne: "1 ቦታ",
    noResults: "እስካሁን የሚመሳሰል የለም። እዚህ መኖር ያለበት ቦታ ያውቃሉ? ያክሉት።",
    unclaimed: "ያልተረጋገጠ",
    unclaimedHint: "ከሕዝባዊ የካርታ መረጃ የተወሰደ — ንግዱ እስካሁን አላረጋገጠውም።",
    unconfirmed: "ገና ያልተረጋገጠ",
    unconfirmedHint: "ከGoogle ካርታ የተገኘ እና ገና ያልተረጋገጠ — ከመሄድዎ በፊት ይደውሉ ወይም በGoogle ካርታ ይክፈቱ። የእርስዎ ንግድ ነው? ስልክና የሥራ ሰዓት ለመጨመር ይረከቡት።",
    verified: "በባለቤቱ የተረጋገጠ",
    call: "ይደውሉ",
    website: "ድረ ገጽ",
    directions: "አቅጣጫ",
    openInMaps: "በGoogle ካርታ ይክፈቱ",
    viewOnMap: "በካርታ ይመልከቱ",
    details: "ዝርዝር",
    hours: "የስራ ሰዓት",
    phone: "ስልክ",
    address: "የት",
    socials: "በኢንተርኔት",
    claim: "ይህ የእርስዎ ንግድ ነው? ይረከቡት",
    claimHint: "መግለጫ፣ ፎቶ፣ ሰዓትና አድራሻ በነፃ ያክሉ።",
    generated: "ከዝርዝሩ መረጃ የተዘጋጀ ማጠቃለያ። ባለቤቱ በራሱ መግለጫ ሊተካው ይችላል።",
    osmCredit: "የቦታ መረጃ © OpenStreetMap አበርካቾች",
    back: "ሁሉም ንግዶች",
    businesses: "ንግዶች",
    community: "ማህበረሰብ",
    openNow: "አሁን ክፍት",
    closedNow: "ዝግ",
    until: "እስከ {t}",
    opensToday: "{t} ይከፈታል",
    opensDay: "{d} {t} ይከፈታል",
    open24: "24 ሰዓት ክፍት",
    nearMe: "በአቅራቢያዬ",
    locating: "አካባቢዎን በመፈለግ ላይ…",
    noLocation: "አካባቢዎን ማግኘት አልተቻለም",
    away: "{d} ርቀት",
    showMap: "ካርታ",
    showList: "ዝርዝር",
    share: "አጋራ",
    copied: "ሊንኩ ተቀድቷል",
    copyLink: "ሊንኩን ቅዳ",
    showMore: "ተጨማሪ አሳይ",
    nearby: "በአቅራቢያ",
    googleTitle: "በGoogle ካርታ",
    googleReviews: "{n} የGoogle ግምገማዎች",
    readOnGoogle: "ሁሉንም ግምገማዎች በGoogle ካርታ",
    readMore: "ተጨማሪ ያንብቡ",
    showLess: "ያሳንሱ",
    fromGoogle: "ደረጃ፣ ግምገማዎችና ዝርዝሮች ከGoogle ካርታ በቀጥታ። ግምገማዎቹ የGoogle ተጠቃሚዎች ናቸው።",
    googleClosedPermanently: "Google ካርታ ይህ ቦታ በቋሚነት እንደተዘጋ ይገልጻል። ከመሄድዎ በፊት ይደውሉ።",
    googleClosedTemporarily: "Google ካርታ ይህ ቦታ ለጊዜው እንደተዘጋ ይገልጻል።",
    googlePhotos: "ፎቶዎች",
    googlePhotoBy: "ፎቶ፦ {name}",
    googleServices: "አገልግሎቶች",
    googlePrice: { FREE: "ነፃ", INEXPENSIVE: "ርካሽ", MODERATE: "መካከለኛ ዋጋ", EXPENSIVE: "ውድ", VERY_EXPENSIVE: "በጣም ውድ" },
    googleAmenities: {
      hasDineIn: "እዚያው መመገብ",
      hasTakeout: "ይዞ መሄድ",
      hasDelivery: "ማድረስ (ዴሊቨሪ)",
      isReservable: "ቦታ ማስያዝ ይቻላል",
      hasOutdoorSeating: "የውጭ መቀመጫ",
      servesCoffee: "ቡና",
      servesBreakfast: "ቁርስ",
      servesLunch: "ምሳ",
      servesDinner: "እራት",
      servesDessert: "ጣፋጭ ምግቦች",
      servesVegetarianFood: "የአትክልት ምግብ",
      isGoodForChildren: "ለልጆች ተስማሚ",
      isGoodForGroups: "ለቡድን ተስማሚ",
      hasRestroom: "መጸዳጃ ቤት",
      wheelchairEntrance: "ለዊልቸር ተደራሽ መግቢያ",
      acceptsCards: "ካርድ ይቀበላል",
      freeParking: "ነፃ ፓርኪንግ",
    },
    allInCategory: "ሁሉም {c}",
    showing: "ከ{t} {n} በማሳየት ላይ",
    sortRecommended: "የሚመከሩ",
    sortAZ: "ሀ–ፐ",
    clearFilters: "ማጣሪያዎችን አጽዳ",
    addIt: "ቦታ ያክሉ",
    source: { osm: "ምንጭ፦ OpenStreetMap", owner: "በንግዱ የተጨመረ", admin: "በቡልቡላ ማውጫ የተጨመረ" },
    suggestEdit: "እርማት ይጠቁሙ",
    days: ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ", "እሑድ"],
  },
  nav: [
    { label: "መነሻ", href: "/" },
    { label: "ንግዶች", href: "/businesses" },
    { label: "ስለ እኛ", href: "/about" },
  ],
  cta: { label: "ንግድዎን ያክሉ", href: "/add" },
  hero: {
    eyebrow: "ቦሌ ቡልቡላ · አዲስ አበባ",
    title: "የቡልቡላ ሁሉ ነገር፣ በአንድ ቦታ።",
    body: "በቦሌ ቡልቡላ ያሉ ካፌዎች፣ ዳቦ ቤቶች፣ ፋርማሲዎች፣ ባንኮች፣ ሱቆችና አገልግሎቶች — ከስልክ ቁጥር፣ የስራ ሰዓት፣ ድረ ገጽና አቅጣጫ ጋር።",
    stats: { businesses: "የተመዘገቡ ቦታዎች", categories: "ዘርፎች" },
  },
  categoriesSection: { eyebrow: "ያስሱ", title: "ምን እየፈለጉ ነው?" },
  mapSection: { eyebrow: "በካርታ ላይ", title: "ቡልቡላ በጨረፍታ", body: "ቦታው የሚታወቅ እያንዳንዱ ዝርዝር። ለዝርዝር ምልክቱን ይንኩ።" },
  newest: { eyebrow: "በማውጫው", title: "በቡልቡላ ያሉ ቦታዎች", link: { label: "ሁሉንም ይመልከቱ", href: "/businesses" } },
  ownerBand: {
    title: "በቡልቡላ ንግድ አለዎት?",
    body: "በነፃ ያክሉት፣ ወይም ዝርዝርዎን ተረክበው መግለጫ፣ ፎቶ፣ ሰዓትና ድረ ገጽ ያክሉ። እያንዳንዱን ማመልከቻ ከመታተሙ በፊት እንገመግማለን።",
    button: "ንግድዎን ያክሉ",
  },
  listPage: { eyebrow: "ማውጫ", title: "በቦሌ ቡልቡላ ያሉ ንግዶች", intro: "በስም ይፈልጉ ወይም በዘርፍ ይምረጡ።" },
  addPage: {
    eyebrow: "ነፃ ምዝገባ",
    title: "ንግድዎን ያክሉ",
    intro: "ስለ ንግድዎ ይንገሩን። እያንዳንዱን ማመልከቻ አጣርተን በጥቂት ቀናት ውስጥ እናትማለን።",
    claimingTitle: "እየተረከቡ ያሉት",
    sections: { business: "ንግድዎ", contact: "ደንበኞች እንዴት ያገኙዎታል", about: "ይግለጹት", you: "ስለ እርስዎ" },
    fields: {
      nameEn: "የንግዱ ስም (በእንግሊዝኛ)",
      nameAm: "የንግዱ ስም (በአማርኛ፣ አማራጭ)",
      category: "ዘርፍ",
      chooseCategory: "ዘርፍ ይምረጡ",
      landmark: "በቡልቡላ የት?",
      landmarkHint: "ሰዎች የሚያውቁት ምልክት፣ ለምሳሌ “93 ማዞሪያ አጠገብ”።",
      mapsLink: "የGoogle ካርታ ሊንክ (አማራጭ)",
      mapsLinkHint: "ቦታዎን በGoogle ካርታ ይክፈቱ → Share → Copy link።",
      phone: "ስልክ",
      website: "ድረ ገጽ",
      facebook: "Facebook",
      instagram: "Instagram",
      telegram: "Telegram",
      hours: "የስራ ሰዓት",
      hoursHint: "ለምሳሌ ሰኞ–ቅዳሜ 2:00–2:00",
      descriptionEn: "መግለጫ (በእንግሊዝኛ)",
      descriptionAm: "መግለጫ (በአማርኛ፣ አማራጭ)",
      yourName: "ስምዎ",
      yourPhone: "ስልክዎ (አይታተምም)",
      relationship: "እርስዎ…",
      owner: "ባለቤት",
      manager: "ሥራ አስኪያጅ / ሠራተኛ",
      customer: "ደንበኛ",
      consent: "መረጃው ትክክል እንደሆነና ሊታተም እንደሚችል አረጋግጣለሁ።",
    },
    submit: "ለግምገማ ይላኩ",
    sending: "በመላክ ላይ…",
    successTitle: "እናመሰግናለን!",
    successBody: "ማመልከቻዎ ደርሶናል፤ በቅርቡ እንገመግመዋለን። ለማረጋገጥ ልንደውልልዎ እንችላለን።",
    another: "ሌላ ንግድ ያክሉ",
    errors: {
      required: "እባክዎ የንግዱን ስም፣ ዘርፍ እንዲሁም ስምዎንና ስልክዎን ይሙሉ።",
      contact: "ቢያንስ አንድ መገናኛ ያክሉ፦ ስልክ፣ ድረ ገጽ ወይም የማህበራዊ ሚዲያ ሊንክ።",
      consent: "እባክዎ መረጃው ሊታተም እንደሚችል ያረጋግጡ።",
      failed: "ይቅርታ፣ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
    },
  },
  aboutPage: {
    eyebrow: "ስለ እኛ",
    title: "ለቦሌ ቡልቡላ የተዘጋጀ ማውጫ",
    intro: "ቡልቡላ ማውጫ ሰዎች በአካባቢያቸው ያሉ ንግዶችንና አገልግሎቶችን እንዲያገኙ፣ የአካባቢው ንግዶችም እንዲገኙ ይረዳል።",
    sections: [
      {
        title: "ዝርዝሮቹ ከየት ይመጣሉ",
        body: "የመጀመሪያዎቹ ዝርዝሮች ከOpenStreetMap — በበጎ ፈቃደኞች ከተሠራ ነፃ ካርታ — የተወሰዱ ናቸው፤ ንግዱ እስኪያረጋግጣቸው “ያልተረጋገጠ” ተብለው ይታያሉ። የተቀሩት በንግድ ባለቤቶች ተጨምረው በእኛ ይገመገማሉ።",
      },
      {
        title: "ለንግዶች ነፃ",
        body: "ንግድ መመዝገብ ነፃ ነው። ባለቤቶች በእንግሊዝኛና በአማርኛ መግለጫ፣ ፎቶ፣ የስራ ሰዓት፣ ስልክ፣ ድረ ገጽና የማህበራዊ ሚዲያ ሊንኮችን ማክልና በማንኛውም ጊዜ ማሻሻል ይችላሉ።",
      },
      {
        title: "የትኛው አካባቢ",
        body: "ማውጫው ከቡልቡላ ወንዝ በስተምሥራቅ ያለውን ቦሌ ቡልቡላን ይሸፍናል — ቦሌ 17/19/20፣ 93 ማዞሪያ፣ የቡልቡላ ኮንዶሚኒየሞችና ወደ ቦሌ ሚካኤል የሚወስደው መንገድ አካባቢ።",
      },
    ],
    contactTitle: "ጥያቄ ወይም እርማት",
    privacy: "ማውጫውን ለማሻሻል ጉብኝቶችን ስማቸው ሳይታወቅ እንቆጥራለን፤ ኩኪ፣ መለያ ወይም የIP አድራሻ አናስቀምጥም።",
  },
  footer: {
    blurb: "በቦሌ ቡልቡላ፣ አዲስ አበባ ያሉ ንግዶች፣ አገልግሎቶችና የማህበረሰብ ቦታዎች።",
    explore: "ያስሱ",
    contact: "ያግኙን",
    rights: "የካርታ መረጃ © OpenStreetMap አበርካቾች።",
  },
  reviews: {
    title: "ግምገማዎች",
    count: "{n} ግምገማዎች",
    one: "1 ግምገማ",
    none: "እስካሁን ግምገማ የለም። ሄደው ያውቃሉ? እንዴት እንደነበር ለጎረቤቶችዎ ይንገሩ።",
    write: "ግምገማ ይጻፉ",
    yourRating: "የእርስዎ ደረጃ",
    stars: ["ደካማ", "መካከለኛ", "ጥሩ", "በጣም ጥሩ", "እጅግ በጣም ጥሩ"],
    name: "የመጀመሪያ ስምዎ",
    text: "እንዴት ነበር? (አማራጭ)",
    textHint: "ፍትሃዊና ግልጽ ይሁኑ፦ አገልግሎት፣ ዋጋ፣ የሥራ ሰዓት። ሊንክ ወይም ስልክ ቁጥር አያስገቡ።",
    submit: "ግምገማ ይላኩ",
    sending: "በመላክ ላይ…",
    thanks: "እናመሰግናለን! ግምገማዎ ከተረጋገጠ በኋላ ይታያል።",
    moderated: "ግምገማዎቹ የጎብኚዎች ናቸው፤ ከመታየታቸው በፊት ይረጋገጣሉ።",
    showAll: "ሁሉንም {n} ግምገማዎች ይመልከቱ",
    latestEyebrow: "ከጎረቤቶች",
    latestTitle: "የቅርብ ጊዜ ግምገማዎች",
    months: ["ጃን", "ፌብ", "ማርች", "ኤፕሪ", "ሜይ", "ጁን", "ጁላይ", "ኦገ", "ሴፕ", "ኦክቶ", "ኖቬ", "ዲሴ"],
    errors: {
      rating: "እባክዎ የኮከብ ደረጃ ይምረጡ።",
      name: "የመጀመሪያ ስምዎን ያስገቡ።",
      links: "እባክዎ ሊንክ፣ የተጠቃሚ ስም ወይም ስልክ ቁጥር አያስገቡ።",
      already: "ዛሬ ይህን ቦታ አስቀድመው ገምግመዋል።",
      failed: "ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
    },
  },
};

const dictionaries: Record<Locale, Content> = { en, am };

export function getContent(locale: Locale): Content {
  return dictionaries[locale];
}
