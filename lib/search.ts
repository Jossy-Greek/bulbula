/**
 * Forgiving search for the directory, shared by the list and the home-page
 * suggestions. Plain functions, safe in server and client code.
 *
 * - case, punctuation and accents are ignored;
 * - Amharic letters that sound the same are treated as one
 *   (ሀ/ሐ/ኀ and ሃ/ሓ/ኃ, ሰ/ሠ, አ/ዐ/ኣ/ዓ, ጸ/ፀ), so "መድሐኒት" finds "መድኃኒት";
 * - apostrophes are dropped, so "kaldis" finds "Kaldi's";
 * - everyday words are expanded across English and Amharic
 *   ("pharmacy" also finds ፋርማሲ and መድኃኒት; "coffee" finds cafés).
 */

// Each Ethiopic consonant has 8 forms in consecutive code points.
const SAME_SOUND: [from: number, to: number][] = [
  [0x1210, 0x1200], // ሐ → ሀ
  [0x1280, 0x1200], // ኀ → ሀ
  [0x1220, 0x1230], // ሠ → ሰ
  [0x12d0, 0x12a0], // ዐ → አ
  [0x1340, 0x1338], // ፀ → ጸ
];

export function normalize(s: string) {
  let out = "";
  for (const ch of s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")) {
    const c = ch.codePointAt(0)!;
    const row = SAME_SOUND.find(([from]) => c >= from && c < from + 8);
    let n = row ? row[1] + (c - row[0]) : c;
    // In the ሀ and አ rows the 1st and 4th forms sound the same (ሀ/ሃ "ha", አ/ኣ "a").
    if ((n >= 0x1200 && n < 0x1208) || (n >= 0x12a0 && n < 0x12a8)) n = (n & ~7) | (n % 8 === 3 ? 0 : n % 8);
    out += String.fromCodePoint(n);
  }
  return out.replace(/['’`]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Groups of words that mean the same thing for searching. */
const SYNONYMS: string[][] = [
  ["pharmacy", "pharma", "drug", "medicine", "ፋርማሲ", "መድኃኒት", "መድሃኒት"],
  ["cafe", "café", "coffee", "ካፌ", "ቡና"],
  ["restaurant", "food", "eat", "burger", "pizza", "ምግብ", "ሬስቶራንት"],
  ["bakery", "bread", "cake", "pastry", "ዳቦ", "ኬክ"],
  ["bank", "atm", "microfinance", "ባንክ"],
  ["salon", "beauty", "barber", "hair", "nail", "spa", "ሳሎን", "ውበት", "ፀጉር"],
  ["clinic", "hospital", "doctor", "medical", "dental", "dentist", "eye", "health", "ክሊኒክ", "ሆስፒታል", "ጤና"],
  ["gym", "fitness", "sport", "ጂም", "ስፖርት"],
  ["school", "academy", "kindergarten", "kg", "education", "ትምህርት"],
  ["supermarket", "shop", "store", "grocery", "market", "mart", "ሱቅ", "ሱፐርማርኬት", "ገበያ"],
  ["laundry", "dry", "cleaning", "ላውንድሪ"],
  ["car", "wash", "carwash", "garage", "mechanic", "ካርዋሽ", "ጋራዥ"],
  ["church", "orthodox", "ቤተ", "ክርስቲያን", "ቤተክርስቲያን"],
  ["hotel", "guest", "pension", "lodging", "ሆቴል"],
  ["real", "estate", "apartment", "house", "ሪል", "እስቴት"],
  ["phone", "mobile", "electronics", "repair", "computer", "ስልክ"],
  ["clothes", "clothing", "fashion", "boutique", "ልብስ"],
];
const LOOKUP = new Map<string, string[]>();
for (const group of SYNONYMS) {
  const norm = group.map(normalize);
  for (const w of norm) LOOKUP.set(w, norm);
}

/** Every word of the query must match (as itself or a synonym) somewhere in the text. */
export function matchesQuery(text: string, query: string) {
  const hay = normalize(text);
  const words = normalize(query).split(" ").filter(Boolean);
  return words.every((w) => (LOOKUP.get(w) ?? [w]).some((alt) => hay.includes(alt)));
}
