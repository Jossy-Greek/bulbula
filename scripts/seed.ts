/**
 * Loads the starting directory: the categories, the places OpenStreetMap
 * records on the Bulbula side of the river (base data 2026-07-24, read through
 * the Overpass API on 2026-10-26), and both Tukiya Coffee branches from their
 * Google Maps listings. Listings carry facts only — no written description —
 * and are published unclaimed, so owners can claim and correct them.
 * Runs only on an empty directory.
 *
 *   npm run seed
 *
 * It creates no user accounts: the first admin signs up at /admin.
 */
import { getPayload } from "payload";
import config from "@payload-config";

type Cat = { slug: string; en: string; am: string; group: "business" | "community"; icon: string };

const CATEGORIES: Cat[] = [
  { slug: "cafes-restaurants", en: "Cafés & restaurants", am: "ካፌና ምግብ ቤት", group: "business", icon: "coffee" },
  { slug: "bakeries", en: "Bakeries", am: "ዳቦ ቤቶች", group: "business", icon: "croissant" },
  { slug: "shops", en: "Shops & supermarkets", am: "ሱቆችና ሱፐርማርኬቶች", group: "business", icon: "shopping-cart" },
  { slug: "pharmacies", en: "Pharmacies", am: "መድኃኒት ቤቶች", group: "business", icon: "pill" },
  { slug: "banks", en: "Banks", am: "ባንኮች", group: "business", icon: "landmark" },
  { slug: "hotels", en: "Hotels & guest houses", am: "ሆቴሎችና እንግዳ ማረፊያዎች", group: "business", icon: "bed" },
  { slug: "real-estate", en: "Real estate", am: "ሪል እስቴት", group: "business", icon: "home" },
  { slug: "beauty", en: "Salons & beauty", am: "የውበት ሳሎኖች", group: "business", icon: "scissors" },
  { slug: "services", en: "Services & repairs", am: "አገልግሎትና ጥገና", group: "business", icon: "wrench" },
  { slug: "education", en: "Schools & training", am: "ትምህርት ቤቶችና ስልጠና", group: "business", icon: "graduation-cap" },
  { slug: "health", en: "Health centres", am: "ጤና ጣቢያዎች", group: "community", icon: "heart-pulse" },
  { slug: "worship", en: "Places of worship", am: "የአምልኮ ቦታዎች", group: "community", icon: "church" },
  { slug: "public", en: "Public services", am: "የመንግሥት አገልግሎቶች", group: "community", icon: "shield" },
  { slug: "community", en: "Community organisations", am: "የማኅበረሰብ ድርጅቶች", group: "community", icon: "hand-heart" },
];

type Place = {
  cat: string;
  en: string;
  am?: string;
  lat: number;
  lng: number;
  osmId?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  hours?: string;
  landmarkEn?: string;
  landmarkAm?: string;
  note?: string;
};

// Amharic names are as tagged in OpenStreetMap; English names are its
// `name:en` where present, otherwise a plain rendering of the Amharic name.
const PLACES: Place[] = [
  { cat: "banks", en: "Tsehay Bank — Bole Bulbula Branch", lat: 8.94842, lng: 38.78497, osmId: "n10709730263", hours: "Mo-Sa 08:00-17:00", website: "https://www.tsehaybank.com.et/" },
  { cat: "banks", en: "United Bank — Bulbula Branch", am: "ህብረት ባንክ ቡልቡላ ቅርንጫፍ", lat: 8.94819, lng: 38.78208, osmId: "n7941310885" },
  { cat: "banks", en: "Commercial Bank of Ethiopia — Bulbula", am: "ኢትዮጵያ ንግድ ባንክ - ቡልቡላ", lat: 8.94876, lng: 38.78102, osmId: "n6301491087" },
  { cat: "banks", en: "Wegagen Bank", am: "ወጋገን ባንክ", lat: 8.94783, lng: 38.78304, osmId: "n9773295819", phone: "+251 11 470 0895", hours: "Mo-Fr 08:00-18:00; Sa 08:00-17:00" },
  { cat: "hotels", en: "Refenti Hotel", lat: 8.94848, lng: 38.78472, osmId: "w1509744917" },
  { cat: "real-estate", en: "Betegna Real Estate", am: "ቤተኛ ሪል እስቴት", lat: 8.94499, lng: 38.7801, osmId: "n10861143578", phone: "+251 913 18 4575", hours: "24/7" },
  { cat: "real-estate", en: "Ease Real Estate", am: "ኢዝ ሪል ስቴት", lat: 8.94814, lng: 38.78469, osmId: "n6255867185" },
  { cat: "services", en: "Bogale Grain Mill", am: "ቦጋለ ወፍጮ ቤት", lat: 8.95349, lng: 38.77808, osmId: "n9773321117", phone: "0920 250 631", hours: "Mo-Sa 08:00-18:00" },
  {
    cat: "bakeries",
    en: "Aberus Bakery",
    lat: 8.96058,
    lng: 38.7855,
    osmId: "w1217872126",
    landmarkEn: "Bole Bulbula, 93 Mazoriya",
    note: "OSM has this twice: w1217872126 and n8561037418 (\"aberus mana daabboo\"), same spot. Merged into one listing.",
  },
  { cat: "shops", en: "Kal Books", lat: 8.96837, lng: 38.77471, osmId: "n9599276217", note: "OSM tags it shop=books with the name \"kal\" only." },
  { cat: "shops", en: "Shoa Shopping", am: "ሸዋ ሾፒንግ", lat: 8.94781, lng: 38.78314, osmId: "n9773320817", hours: "Mo-Su 08:00-21:00" },
  {
    cat: "cafes-restaurants",
    en: "Tukiya Coffee — Bole 17/19/20",
    am: "ቱኪያ ቡና — ቦሌ 17/19/20",
    lat: 8.9522341,
    lng: 38.7894274,
    phone: "+251 93 501 7555",
    facebook: "https://www.facebook.com/tukiyacoffee/",
    landmarkEn: "Bole 17/19/20 (Plus Code XQ2Q+VQ)",
    note: "From the Google Maps listing, 2026-10-19. Not in OpenStreetMap. Opens 8 AM per Maps; closing time unknown.",
  },
  {
    cat: "cafes-restaurants",
    en: "Tukiya Coffee — 93 Mazoriya",
    am: "ቱኪያ ቡና — 93 ማዞሪያ",
    lat: 8.9611787,
    lng: 38.7861338,
    facebook: "https://www.facebook.com/tukiyacoffee/",
    landmarkEn: "Bulbula, 93 Mazoriya (Plus Code XQ6P+CCW)",
    note: "From the Google Maps listing, 2026-10-19. Not in OpenStreetMap.",
  },
  { cat: "health", en: "Wereda 12 Health Center", lat: 8.95351, lng: 38.78247, osmId: "w717495697", note: "May be the same place as Bulbula Health Center (w788575459), about 40 m away. Check on site." },
  { cat: "health", en: "Bulbula Health Center", am: "ቡልቡላ ጤና ጣቢያ", lat: 8.95358, lng: 38.78208, osmId: "w788575459", note: "May be the same place as Wereda 12 Health Center (w717495697). Check on site." },
  { cat: "public", en: "Bulbula Police Station", am: "ቡልቡላ ፖሊስ ጣቢያ", lat: 8.95338, lng: 38.78298, osmId: "n6301491088" },
  { cat: "community", en: "Kibre Aregawyan", am: "ክብረ አረጋውያን", lat: 8.95933, lng: 38.78234, osmId: "n10558960109", note: "OSM: office=ngo." },
  { cat: "worship", en: "Bole Bulbula St. George Church", am: "ቦሌ ቡልቡላ ቅዱስ ጊዮርጊስ ቤተ ክርስቲያን", lat: 8.96708, lng: 38.78022, osmId: "n8152231530", landmarkAm: "ከቦሌ ሚካኤል ወደ ቡልቡላ በሚወስደው መንገድ" },
  { cat: "worship", en: "Bole Bulbula Abba Samuel and St. Amanuel Church", am: "ቦሌ ቡልቡላ ምሥካበ ቅዱሳን አባ ሳሙኤል እና ቅዱስ አማኑኤል ቤተ ክርስቲያን", lat: 8.95493, lng: 38.77812, osmId: "n8415796087", landmarkAm: "ከቦሌ ቡልቡላ 40/60 የጋራ መኖሪያ ከፍ ብሎ" },
  { cat: "worship", en: "Bole Bulbula Debre Medhanit Medhanealem Church", am: "ቦሌ ቡልቡላ ደብረ መድኃኒት መድኃኔዓለም ቤተ ክርስቲያን", lat: 8.94726, lng: 38.77776, osmId: "n8415723756" },
  { cat: "worship", en: "Bulbula St. Mary and St. John Orthodox Church", am: "ቦሌ ቡልቡላ ፍኖተ ሕይወት ቅድስት ማርያም እና መጥምቀ መለኮት ቅዱስ ዩሐንስ ቤተ ክርስቲያን", lat: 8.94856, lng: 38.79598, osmId: "n8152231347", landmarkAm: "ቦሌ ቡልቡላ ኮንዶሚኒየም ጀርባ" },
  { cat: "worship", en: "Bulbula Abune Teklehaimanot and St. Michael Monastery", am: "ቡልቡላ አቡነ ተክለ ሃይማኖት እና ቅዱስ ሚካኤል ገዳም", lat: 8.9482, lng: 38.80156, osmId: "n8415132322", landmarkAm: "ቦሌ ቡልቡላ ከቅድስት ማርያም ቤተ ክርስቲያን ዝቅ ብሎ ተንጠልጣይ ድልድይ አከባቢ" },
  { cat: "worship", en: "Addis Amba Debre Genet Kidane Mihret Church", am: "አዲስ አምባ ደብረ ገነት ቅድስት ኪዳነ ምሕረት ቤተ ክርስቲያን", lat: 8.95714, lng: 38.77576, osmId: "n8415798779" },
  { cat: "worship", en: "Debre Fisiha St. Gabriel Church", am: "ደብረ ፍስሃ ቅዱስ ገብርኤል ቤተ ክርስቲያን", lat: 8.95458, lng: 38.77466, osmId: "n8415809011" },
  { cat: "worship", en: "Hamere Werk St. Mary and St. Arsema Church", am: "ሐመረ ወርቅ ቅድስት ማርያም እና ቅድስት አርሴማ ቤተ ክርስቲያን", lat: 8.93541, lng: 38.7764, osmId: "n8152231838", landmarkAm: "ወርቁ ሠፈር" },
  { cat: "worship", en: "Chabad Ethiopia", lat: 8.97781, lng: 38.778, osmId: "w1534691645" },
];

const payload = await getPayload({ config });

const existing = await payload.count({ collection: "businesses" });
if (existing.totalDocs > 0) {
  payload.logger.info(`Directory already has ${existing.totalDocs} listings — not seeding.`);
  process.exit(0);
}

const catIds = new Map<string, number>();
for (const [i, c] of CATEGORIES.entries()) {
  const doc = await payload.create({ collection: "categories", locale: "en", data: { name: c.en, slug: c.slug, group: c.group, icon: c.icon as never, order: i } });
  await payload.update({ collection: "categories", id: doc.id, locale: "am", data: { name: c.am } });
  catIds.set(c.slug, doc.id);
}

for (const p of PLACES) {
  const doc = await payload.create({
    collection: "businesses",
    locale: "en",
    data: {
      name: p.en,
      category: catIds.get(p.cat)!,
      lat: p.lat,
      lng: p.lng,
      phone: p.phone,
      website: p.website,
      facebook: p.facebook,
      hours: p.hours,
      landmark: p.landmarkEn,
      status: "published",
      claimed: false,
      featured: false,
      source: p.osmId ? "osm" : "admin",
      osmId: p.osmId,
      adminNotes: p.note,
    },
  });
  // Name is required per locale, so only places with an Amharic name get an
  // Amharic version; the rest fall back to English. OSM hours are rendered in
  // either language from the one stored value.
  if (p.am) {
    await payload.update({
      collection: "businesses",
      id: doc.id,
      locale: "am",
      data: { name: p.am, ...(p.landmarkAm ? { landmark: p.landmarkAm } : {}), ...(p.hours ? { hours: p.hours } : {}) },
    });
  }
}

payload.logger.info(`Seeded ${CATEGORIES.length} categories and ${PLACES.length} places.`);
process.exit(0);
