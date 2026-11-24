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

/** Every word of the query must match (as itself or a synonym) somewhere in the text, allowing a typo. */
export function matchesQuery(text: string, query: string) {
  const hay = normalize(text);
  const words = normalize(query).split(" ").filter(Boolean);
  return words.every((w) => {
    if ((LOOKUP.get(w) ?? [w]).some((alt) => hay.includes(alt))) return true;
    // A typo ("pharmcy"): the nearest known word stands in for it, or a word of the text is close enough.
    const fix = nearSynonym(w);
    if (fix && fix.some((alt) => hay.includes(alt))) return true;
    return hay.split(" ").some((h) => close(w, h));
  });
}

/** Typos allowed for a word of this length: none under 4 letters, 1 up to 7, then 2. */
const allowed = (len: number) => (len < 4 ? 0 : len < 8 ? 1 : 2);

/** True when `a` is within the typo allowance of `b` (whole words; partial words still match exactly above). */
function close(a: string, b: string) {
  const k = allowed(a.length);
  if (!k || Math.abs(a.length - b.length) > k) return false;
  return distance(a, b) <= k;
}

/** The synonym group whose word is closest to a misspelled query word. */
function nearSynonym(w: string) {
  for (const [word, group] of LOOKUP) if (close(w, word)) return group;
  return null;
}

/** Edit distance with swaps counted as one edit (Damerau–Levenshtein, restricted). */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
