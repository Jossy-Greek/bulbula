import type { Locale } from "./content";
import { site } from "./site";

/**
 * The privacy policy (/[locale]/privacy), also linked from Google Play. It describes what the code
 * actually does; when collection changes (a new form field, a new service), update this and `UPDATED`.
 */
export const UPDATED = "2026-11-26";

type Section = { title: string; body: string[] };
export type Privacy = { title: string; intro: string; updated: string; sections: Section[] };

const email = site.operator.email;

const en: Privacy = {
  title: "Privacy policy",
  intro: "What Bulbula Directory (the website and the Android app) collects, why, and what you can ask us to do with it.",
  updated: "Last updated",
  sections: [
    {
      title: "Who we are",
      body: [
        `Bulbula Directory is a free guide to businesses and places in Bole Bulbula, Addis Ababa, run by ${site.operator.name} in Addis Ababa, Ethiopia. For anything about your data, write to ${email}.`,
      ],
    },
    {
      title: "In short",
      body: [
        "No ads, no cookies for tracking, and we never sell or rent your information.",
        "You can use the website and the app without an account. Signing in with Google is optional.",
        "Your location stays on your phone.",
      ],
    },
    {
      title: "Visits and searches",
      body: [
        "To see which places and features are useful, we count page and place views; taps on Call, Directions, Website and Share; and searches and category filters (including the words searched). With each one we keep the language, the kind of device, the country and where the visit came from (for example Telegram or Google).",
        "We don't use cookies or advertising IDs for this. To count each visitor once a day, the server makes a code from your internet address and browser or app version together with a secret that changes every day. The code can't be traced back to you or followed from one day to the next, and your internet address itself is not stored.",
      ],
    },
    {
      title: "Reviews",
      body: [
        "When you write a review we keep your first name, the stars and your text. An admin checks each review before it is published; once published, the first name, stars and text are public. The same daily visitor code limits how many reviews one visitor can send.",
      ],
    },
    {
      title: "Adding, claiming or correcting a place",
      body: [
        "When you add or claim a place we keep the details you give about the business (name, category, phone, location, hours, description, links and an optional photo). These become public once an admin approves them.",
        "We also keep your name, whether you are the owner, staff or a customer, and your phone number if you give one, so we can check the listing. These are not published. When you suggest a correction we keep your message and, if you give it, a phone number or Telegram handle to reach you. Not published either.",
        "New submissions and corrections are sent to our admins as a Telegram message so they can review them quickly.",
      ],
    },
    {
      title: "App progress and Google sign-in",
      body: [
        "The app keeps your first name, XP, level and badges on your phone. If you choose to sign in with Google, we back them up on our server so they follow you to a new phone. From Google we keep only a scrambled (hashed) form of your account number: not your email, name, photo or contacts.",
      ],
    },
    {
      title: "Location",
      body: [
        "\"Near me\" and the distances to places use your location only on your phone, after you allow it. We never receive or store your location.",
        "One exception you choose: on the website's Add a place form, \"Use my location\" puts the map pin where you stand. That pin is sent only if you send the form, and it is saved as the place's location, not as yours.",
      ],
    },
    {
      title: "Services we use",
      body: [
        "Vercel hosts the website, Neon stores the database, Cloudflare R2 stores photos, and Telegram carries the admin notifications described above. They process data only to provide these services.",
        "Maps on the website are drawn with tiles from OpenStreetMap; your browser downloads them from OpenStreetMap's servers, which see your internet address (the app has no map; its Directions button opens Google Maps). \"Google Maps\" and \"Directions\" buttons open Google Maps, and Google sign-in is handled by Google; Google's own privacy policy applies there.",
      ],
    },
    {
      title: "How long we keep it",
      body: [
        "Published reviews, listings and photos stay while the listing is on Bulbula. Submissions we don't publish, corrections and contact details are kept only as long as we need them to review and follow up. Visit and search records contain no names or internet addresses and are kept for statistics. Signed-in progress is kept until you delete it in the app or ask us to.",
      ],
    },
    {
      title: "Your choices",
      body: [
        `You can ask us to show you, correct or delete what we hold about you (a review, a submission, your contact details or your app progress) by writing to ${email}. We reply within 30 days. To delete your saved app progress yourself, open Profile → Sign out and choose \"Delete my saved progress too\": it is removed from our server at once (reviews and places you sent stay, without the link to you). Uninstalling the app removes everything stored on the phone.`,
      ],
    },
    {
      title: "Children",
      body: ["Bulbula is meant for adults and isn't directed at children under 13. If you believe a child has sent us information, write to us and we will delete it."],
    },
    {
      title: "Security and changes",
      body: [
        "Everything travels over encrypted connections (HTTPS), and only a small number of admins can open submissions and contact details. If we change what we collect, we update this page and the date at the top.",
      ],
    },
  ],
};

const am: Privacy = {
  title: "የግላዊነት ፖሊሲ",
  intro: "ቡልቡላ ማውጫ (ድረ-ገጹና የአንድሮይድ መተግበሪያው) የሚሰበስበው፣ ለምን እንደሆነ እና እንድናደርግልዎ መጠየቅ የሚችሉት።",
  updated: "ለመጨረሻ ጊዜ የተሻሻለው",
  sections: [
    {
      title: "እኛ ማን ነን",
      body: [
        `ቡልቡላ ማውጫ በቦሌ ቡልቡላ፣ አዲስ አበባ ያሉ ንግዶችንና ቦታዎችን የሚያሳይ ነፃ መመሪያ ሲሆን በአዲስ አበባ፣ ኢትዮጵያ በ${site.operator.name} ይመራል። ስለ መረጃዎ ለማንኛውም ጥያቄ ወደ ${email} ይጻፉ።`,
      ],
    },
    {
      title: "በአጭሩ",
      body: [
        "ማስታወቂያ የለም፣ ለክትትል ኩኪ አንጠቀምም፣ መረጃዎን በጭራሽ አንሸጥም ወይም አናከራይም።",
        "ድረ-ገጹንና መተግበሪያውን ያለ መለያ መጠቀም ይችላሉ። በGoogle መግባት አማራጭ ነው።",
        "አካባቢዎ (ሎኬሽን) በስልክዎ ላይ ብቻ ይቀራል።",
      ],
    },
    {
      title: "ጉብኝቶችና ፍለጋዎች",
      body: [
        "የትኞቹ ቦታዎችና ባህሪያት ጠቃሚ እንደሆኑ ለማወቅ የገጽና የቦታ ጉብኝቶችን፣ በ«ደውል»፣ «አቅጣጫ»፣ «ድረ-ገጽ» እና «አጋራ» ላይ የሚደረጉ ንክኪዎችን፣ እንዲሁም ፍለጋዎችንና የምድብ ማጣሪያዎችን (የተፈለጉትን ቃላት ጨምሮ) እንቆጥራለን። ከእያንዳንዱ ጋር ቋንቋውን፣ የመሣሪያውን ዓይነት፣ አገሩንና ጉብኝቱ ከየት እንደመጣ (ለምሳሌ ከቴሌግራም ወይም ከGoogle) እናስቀምጣለን።",
        "ለዚህ ኩኪ ወይም የማስታወቂያ መለያ አንጠቀምም። እያንዳንዱን ጎብኚ በቀን አንድ ጊዜ ለመቁጠር አገልጋዩ ከኢንተርኔት አድራሻዎ፣ ከብራውዘርዎ ወይም ከመተግበሪያው ስሪት እና በየቀኑ ከሚቀየር ሚስጥር ኮድ ይሠራል። ይህ ኮድ ወደ እርስዎ ሊመለስ ወይም ከአንድ ቀን ወደ ሌላው ሊከተልዎ አይችልም፤ የኢንተርኔት አድራሻዎ ራሱ አይቀመጥም።",
      ],
    },
    {
      title: "ግምገማዎች",
      body: [
        "ግምገማ ሲጽፉ የመጀመሪያ ስምዎን፣ ኮከቦቹንና ጽሑፍዎን እናስቀምጣለን። እያንዳንዱ ግምገማ ከመታተሙ በፊት በአስተዳዳሪ ይታያል፤ ከታተመ በኋላ የመጀመሪያ ስም፣ ኮከቦቹና ጽሑፉ ለሕዝብ ይታያሉ። ያው የቀን ጎብኚ ኮድ አንድ ጎብኚ የሚልካቸውን ግምገማዎች ብዛት ይገድባል።",
      ],
    },
    {
      title: "ቦታ ማከል፣ መውሰድ ወይም ማረም",
      body: [
        "ቦታ ሲያክሉ ወይም ሲወስዱ ስለ ንግዱ የሚሰጡትን መረጃ (ስም፣ ምድብ፣ ስልክ፣ አካባቢ፣ የስራ ሰዓት፣ መግለጫ፣ ሊንኮችና አማራጭ ፎቶ) እናስቀምጣለን። አስተዳዳሪ ካጸደቃቸው በኋላ ለሕዝብ ይታያሉ።",
        "ዝርዝሩን ለማረጋገጥ ስምዎን፣ ባለቤት፣ ሠራተኛ ወይም ደንበኛ መሆንዎን፣ እንዲሁም ከሰጡን ስልክ ቁጥርዎን እናስቀምጣለን። እነዚህ አይታተሙም። እርማት ሲጠቁሙ መልእክትዎን እና ከሰጡን እርስዎን ለማግኘት ስልክ ወይም የቴሌግራም ስም እናስቀምጣለን። እነዚህም አይታተሙም።",
        "አዳዲስ ማስገቢያዎችና እርማቶች በፍጥነት እንዲገመገሙ ለአስተዳዳሪዎቻችን በቴሌግራም መልእክት ይላካሉ።",
      ],
    },
    {
      title: "የመተግበሪያ እድገትና በGoogle መግባት",
      body: [
        "መተግበሪያው የመጀመሪያ ስምዎን፣ XP፣ ደረጃና ባጆችዎን በስልክዎ ላይ ያስቀምጣል። በGoogle ለመግባት ከመረጡ ወደ አዲስ ስልክ እንዲከተሉዎ በአገልጋያችን ላይ እናስቀምጣቸዋለን። ከGoogle የምናስቀምጠው የመለያ ቁጥርዎን የተቀየረ (hashed) መልክ ብቻ ነው፤ ኢሜይልዎን፣ ስምዎን፣ ፎቶዎን ወይም ዕውቂያዎችዎን አይደለም።",
      ],
    },
    {
      title: "አካባቢ (ሎኬሽን)",
      body: [
        "«በአቅራቢያዬ» እና ወደ ቦታዎች ያለው ርቀት እርስዎ ከፈቀዱ በኋላ አካባቢዎን በስልክዎ ላይ ብቻ ይጠቀማሉ። አካባቢዎን በጭራሽ አንቀበልም ወይም አናስቀምጥም።",
        "እርስዎ የሚመርጡት አንድ ልዩነት፦ በድረ-ገጹ «ቦታ ያክሉ» ቅጽ ላይ «አካባቢዬን ተጠቀም» የካርታውን ምልክት ባሉበት ቦታ ያደርገዋል። ምልክቱ የሚላከው ቅጹን ከላኩ ብቻ ነው፤ የሚቀመጠውም እንደ ቦታው አድራሻ እንጂ እንደ እርስዎ አካባቢ አይደለም።",
      ],
    },
    {
      title: "የምንጠቀማቸው አገልግሎቶች",
      body: [
        "Vercel ድረ-ገጹን ያስተናግዳል፣ Neon የመረጃ ቋቱን ያስቀምጣል፣ Cloudflare R2 ፎቶዎችን ያስቀምጣል፣ ቴሌግራም ከላይ የተጠቀሱትን የአስተዳዳሪ ማሳወቂያዎች ያደርሳል። መረጃን የሚያስተናግዱት እነዚህን አገልግሎቶች ለመስጠት ብቻ ነው።",
        "በድረ-ገጹ ላይ ያሉ ካርታዎች ከOpenStreetMap በሚመጡ ምስሎች ይሳላሉ፤ ብራውዘርዎ ከOpenStreetMap አገልጋዮች ያወርዳቸዋል፤ እነሱም የኢንተርኔት አድራሻዎን ያያሉ (መተግበሪያው ካርታ የለውም፤ የ«አቅጣጫ» ቁልፉ Google Mapsን ይከፍታል)። «Google Maps» እና «አቅጣጫ» ቁልፎች Google Mapsን ይከፍታሉ፣ በGoogle መግባትም በGoogle ይስተናገዳል፤ እዚያ የGoogle የራሱ የግላዊነት ፖሊሲ ይሠራል።",
      ],
    },
    {
      title: "ለምን ያህል ጊዜ እናስቀምጣለን",
      body: [
        "የታተሙ ግምገማዎች፣ ዝርዝሮችና ፎቶዎች ዝርዝሩ በቡልቡላ ላይ እስካለ ድረስ ይቀራሉ። ያላተምናቸው ማስገቢያዎች፣ እርማቶችና የዕውቂያ መረጃዎች የሚቀመጡት ለመገምገምና ለመከታተል እስከሚያስፈልጉን ድረስ ብቻ ነው። የጉብኝትና የፍለጋ መዝገቦች ስም ወይም የኢንተርኔት አድራሻ የላቸውም፤ ለስታቲስቲክስ ይቀመጣሉ። በGoogle የገቡበት እድገት በመተግበሪያው ውስጥ እስኪሰርዙት ወይም እንድንሰርዘው እስኪጠይቁ ድረስ ይቀመጣል።",
      ],
    },
    {
      title: "ምርጫዎችዎ",
      body: [
        `ስለ እርስዎ የያዝነውን (ግምገማ፣ ማስገቢያ፣ የዕውቂያ መረጃዎ ወይም የመተግበሪያ እድገትዎ) እንድናሳይዎ፣ እንድናርመው ወይም እንድንሰርዘው ወደ ${email} በመጻፍ መጠየቅ ይችላሉ። በ30 ቀናት ውስጥ እንመልሳለን። የተቀመጠውን የመተግበሪያ እድገትዎን ራስዎ ለመሰረዝ «መገለጫ» → «ውጣ» ከፍተው «የተቀመጠውን ነጥቤንም ሰርዝ» የሚለውን ይምረጡ፤ ወዲያውኑ ከአገልጋያችን ይሰረዛል (የላኳቸው ግምገማዎችና ቦታዎች ይቀራሉ፣ ከእርስዎ ጋር ያለው ግንኙነት ግን ይወገዳል)። መተግበሪያውን ማራገፍ በስልኩ ላይ የተቀመጠውን ሁሉ ያስወግዳል።`,
      ],
    },
    {
      title: "ልጆች",
      body: ["ቡልቡላ ለአዋቂዎች የተዘጋጀ ሲሆን ከ13 ዓመት በታች ለሆኑ ልጆች የታለመ አይደለም። አንድ ልጅ መረጃ ልኮልናል ብለው ካመኑ ይጻፉልን፤ እንሰርዘዋለን።"],
    },
    {
      title: "ደህንነትና ለውጦች",
      body: [
        "ሁሉም ነገር በተመሰጠሩ ግንኙነቶች (HTTPS) ይጓዛል፤ ማስገቢያዎችንና የዕውቂያ መረጃዎችን መክፈት የሚችሉት ጥቂት አስተዳዳሪዎች ብቻ ናቸው። የምንሰበስበውን ከቀየርን ይህንን ገጽና ከላይ ያለውን ቀን እናሻሽላለን።",
      ],
    },
  ],
};

export const privacy: Record<Locale, Privacy> = { en, am };
