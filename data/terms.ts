import type { Locale } from "./content";
import { site } from "./site";

/**
 * The terms of use (/[locale]/terms). Like the privacy policy, it describes what the site and the
 * app really do; when a rule changes (a new form, a paid feature), update this and `UPDATED`.
 * Not legal advice.
 */
export const UPDATED = "2026-11-26";

type Section = { title: string; body: string[] };
export type Terms = { title: string; intro: string; updated: string; sections: Section[] };

const email = site.operator.email;

const en: Terms = {
  title: "Terms of use",
  intro: "The rules for using Bulbula Directory (the website and the Android app), writing reviews, and adding or claiming a place.",
  updated: "Last updated",
  sections: [
    {
      title: "Who we are",
      body: [
        `Bulbula Directory is a free guide to businesses and places in Bole Bulbula, Addis Ababa, run by ${site.operator.name} in Addis Ababa, Ethiopia. By using the website or the app you agree to these terms. If you don't agree, please don't use them. Questions: ${email}.`,
      ],
    },
    {
      title: "Using the directory",
      body: [
        "The directory is free for personal use: finding places, calling them, getting directions and sharing them.",
        "We work to keep listings right, but phone numbers, hours, prices and menus change. Places marked “Not yet confirmed” come from public maps and our own research and have not been checked by the business. Call ahead before a special trip.",
        "Businesses are responsible for their own goods, services and prices. We are not part of any deal between you and a business.",
        "Links to other services (Google Maps, Telegram, WhatsApp, a business's website) follow those services' own terms.",
      ],
    },
    {
      title: "Reviews",
      body: [
        "Write about your own real experience with the place. Not allowed: insults, threats or hate; other people's phone numbers or private details; adverts or links; spam; reviews of your own business or of a competitor; and reviews written for payment.",
        "An admin checks every review before it is published. We may refuse, shorten or remove a review that breaks these rules, and we publish fair reviews whether they are good or bad.",
        "Your review stays yours. By sending it you allow us to show it, free of charge, on the website and in the app, next to the first name you gave, for as long as the place is listed. Ask us to remove it at any time.",
      ],
    },
    {
      title: "Adding, claiming or correcting a place",
      body: [
        "Only add real places in or near Bole Bulbula, with details you believe are correct.",
        "Only claim a listing if you own the business or are allowed to speak for it. We may call the business's listed number to check, and we may remove a claim we can't confirm.",
        "Only send photos you took or have the right to share. By sending them you allow us to show them on the listing, on the website and in the app.",
        "We decide what is published. We may edit details for clarity or correctness, and we may remove listings that are closed, duplicated, misleading or against the law.",
      ],
    },
    {
      title: "Not allowed",
      body: [
        "Copying the directory in bulk (by scripts, scraping or the API) or republishing it elsewhere; trying to get into the admin, other people's accounts or our servers; overloading the site; pretending to be someone else; or using the site or app to send spam or break the law.",
        "We may block anyone who does these things, and remove what they sent.",
      ],
    },
    {
      title: "The app, XP and badges",
      body: [
        "These terms cover the Android app too. XP, levels and badges are for fun: they have no money value and can't be sold or exchanged. We may correct or reset progress that was gained by misusing the app.",
      ],
    },
    {
      title: "Our content and others'",
      body: [
        "The directory's design, text and the way the listings are put together belong to Bulbula Directory. Business names, logos and photos belong to their owners. Map data is © OpenStreetMap contributors, under the Open Database License.",
      ],
    },
    {
      title: "No guarantees",
      body: [
        "The website and the app are provided free and as they are, without promises that they will always be available, complete or error-free.",
        "As far as the law allows, we are not responsible for losses that come from relying on a listing or from dealing with a business found here. Nothing in these terms takes away rights you have under Ethiopian law that cannot be taken away.",
      ],
    },
    {
      title: "Changes",
      body: [
        "We may change the directory, the app or these terms. The date at the top shows the latest version; if a change matters, we will also say so on the site. Using the directory after a change means you accept the new terms.",
      ],
    },
    {
      title: "Law and contact",
      body: [
        `These terms are governed by the laws of Ethiopia. If something goes wrong, please write to ${email} first: most problems are solved quickly that way. How we handle your information is explained in the privacy policy.`,
      ],
    },
  ],
};

const am: Terms = {
  title: "የአጠቃቀም ደንቦች",
  intro: "ቡልቡላ ማውጫን (ድረ ገጹንና የአንድሮይድ መተግበሪያውን) ለመጠቀም፣ ግምገማ ለመጻፍ እና ቦታ ለማከል ወይም ለመረከብ የሚያገለግሉ ደንቦች።",
  updated: "ለመጨረሻ ጊዜ የተሻሻለው",
  sections: [
    {
      title: "እኛ ማን ነን",
      body: [
        `ቡልቡላ ማውጫ በቦሌ ቡልቡላ፣ አዲስ አበባ ያሉ ንግዶችንና ቦታዎችን የሚያሳይ ነፃ መመሪያ ሲሆን በአዲስ አበባ፣ ኢትዮጵያ በ${site.operator.name} ይመራል። ድረ ገጹን ወይም መተግበሪያውን ሲጠቀሙ በእነዚህ ደንቦች ይስማማሉ። ካልተስማሙ እባክዎ አይጠቀሙባቸው። ጥያቄ ካለዎት፦ ${email}።`,
      ],
    },
    {
      title: "ማውጫውን መጠቀም",
      body: [
        "ማውጫው ለግል አገልግሎት ነፃ ነው፦ ቦታዎችን ለማግኘት፣ ለመደወል፣ አቅጣጫ ለማግኘትና ለማጋራት።",
        "ዝርዝሮቹ ትክክል እንዲሆኑ እንሰራለን፤ ነገር ግን ስልክ ቁጥሮች፣ የስራ ሰዓቶች፣ ዋጋዎችና ሜኑዎች ይቀየራሉ። «ገና ያልተረጋገጠ» የሚል ምልክት ያላቸው ቦታዎች ከሕዝብ ካርታዎችና ከራሳችን ጥናት የተገኙ ናቸው፤ ንግዱ ገና አላረጋገጣቸውም። ለተለየ ጉዞ ከመሄድዎ በፊት ይደውሉ።",
        "ንግዶች ለራሳቸው ዕቃ፣ አገልግሎትና ዋጋ ኃላፊ ናቸው። በእርስዎና በንግዱ መካከል ባለ ማንኛውም ግብይት ውስጥ እኛ ተሳታፊ አይደለንም።",
        "ወደ ሌሎች አገልግሎቶች (Google Maps፣ ቴሌግራም፣ ዋትስአፕ፣ የንግዱ ድረ ገጽ) የሚወስዱ ሊንኮች የእነዚያን አገልግሎቶች ደንቦች ይከተላሉ።",
      ],
    },
    {
      title: "ግምገማዎች",
      body: [
        "ስለ ቦታው የራስዎን እውነተኛ ተሞክሮ ይጻፉ። የማይፈቀዱ፦ ስድብ፣ ዛቻ ወይም ጥላቻ፤ የሌሎች ሰዎች ስልክ ቁጥር ወይም የግል መረጃ፤ ማስታወቂያ ወይም ሊንክ፤ አይፈለጌ መልእክት፤ ስለ ራስዎ ንግድ ወይም ስለ ተፎካካሪዎ የሚጻፍ ግምገማ፤ እና በክፍያ የሚጻፍ ግምገማ።",
        "እያንዳንዱ ግምገማ ከመታተሙ በፊት አስተዳዳሪ ያየዋል። እነዚህን ደንቦች የጣሰ ግምገማን ልንከለክል፣ ልናሳጥር ወይም ልናስወግድ እንችላለን፤ ፍትሃዊ ግምገማዎችን ጥሩም ሆኑ መጥፎ እናትማለን።",
        "ግምገማዎ የእርስዎ ሆኖ ይቀራል። በመላክዎ፣ ቦታው በማውጫው ውስጥ እስካለ ድረስ ከሰጡት የመጀመሪያ ስም ጋር በድረ ገጹና በመተግበሪያው ላይ ያለ ክፍያ እንድናሳየው ይፈቅዳሉ። በማንኛውም ጊዜ እንድናስወግደው መጠየቅ ይችላሉ።",
      ],
    },
    {
      title: "ቦታ ማከል፣ መረከብ ወይም ማረም",
      body: [
        "በቦሌ ቡልቡላ ወይም በአቅራቢያው ያሉ እውነተኛ ቦታዎችን ብቻ፣ ትክክል ነው ብለው በሚያምኑት መረጃ ያክሉ።",
        "ዝርዝርን ይረከቡ የንግዱ ባለቤት ከሆኑ ወይም ንግዱን ወክለው ለመናገር ከተፈቀደልዎ ብቻ ነው። ለማረጋገጥ በንግዱ የተመዘገበ ቁጥር ልንደውል እንችላለን፤ ልናረጋግጠው ያልቻልነውን የመረከብ ጥያቄ ልናስወግድ እንችላለን።",
        "እርስዎ ያነሷቸውን ወይም ለማጋራት መብት ያለዎትን ፎቶዎች ብቻ ይላኩ። በመላክዎ በዝርዝሩ፣ በድረ ገጹና በመተግበሪያው ላይ እንድናሳያቸው ይፈቅዳሉ።",
        "የሚታተመውን የምንወስነው እኛ ነን። ለግልጽነት ወይም ለትክክለኛነት መረጃዎችን ልናርም፣ የተዘጉ፣ የተደጋገሙ፣ አሳሳች ወይም ሕግን የሚጥሱ ዝርዝሮችን ልናስወግድ እንችላለን።",
      ],
    },
    {
      title: "የማይፈቀዱ ነገሮች",
      body: [
        "ማውጫውን በብዛት መቅዳት (በስክሪፕት፣ በስክሬፒንግ ወይም በAPI) ወይም ሌላ ቦታ እንደገና ማተም፤ ወደ አስተዳዳሪ ገጹ፣ ወደ ሌሎች ሰዎች መለያ ወይም ወደ ሰርቨሮቻችን ለመግባት መሞከር፤ ድረ ገጹን ከአቅም በላይ መጫን፤ ሌላ ሰው መስሎ መቅረብ፤ ወይም ድረ ገጹን ወይም መተግበሪያውን አይፈለጌ መልእክት ለመላክ ወይም ሕግ ለመጣስ መጠቀም።",
        "እነዚህን የሚያደርግ ማንኛውንም ሰው ልናግድና የላከውን ልናስወግድ እንችላለን።",
      ],
    },
    {
      title: "መተግበሪያው፣ XP እና ባጆች",
      body: [
        "እነዚህ ደንቦች የአንድሮይድ መተግበሪያውንም ይመለከታሉ። XP፣ ደረጃዎችና ባጆች ለመዝናኛ ናቸው፦ የገንዘብ ዋጋ የላቸውም፣ ሊሸጡ ወይም ሊለወጡ አይችሉም። መተግበሪያውን አላግባብ በመጠቀም የተገኘን ነጥብ ልናስተካክል ወይም ልንሰርዝ እንችላለን።",
      ],
    },
    {
      title: "የእኛና የሌሎች ይዘት",
      body: [
        "የማውጫው ዲዛይን፣ ጽሑፍና ዝርዝሮቹ የተደራጁበት መንገድ የቡልቡላ ማውጫ ነው። የንግዶች ስሞች፣ አርማዎችና ፎቶዎች የባለቤቶቻቸው ናቸው። የካርታ መረጃው © OpenStreetMap አበርካቾች፣ በOpen Database License ስር ነው።",
      ],
    },
    {
      title: "ዋስትና የለም",
      body: [
        "ድረ ገጹና መተግበሪያው በነፃ እና እንዳሉ ይቀርባሉ፤ ሁልጊዜ እንደሚገኙ፣ ሙሉ እንደሆኑ ወይም ስህተት እንደሌለባቸው ቃል አንገባም።",
        "ሕግ በሚፈቅደው መጠን፣ በአንድ ዝርዝር ላይ በመተማመን ወይም እዚህ ካገኙት ንግድ ጋር በመገበያየት ለሚደርስ ጉዳት ኃላፊ አይደለንም። በእነዚህ ደንቦች ውስጥ ያለ ምንም ነገር በኢትዮጵያ ሕግ ሊነጠቁ የማይችሉ መብቶችዎን አይወስድም።",
      ],
    },
    {
      title: "ለውጦች",
      body: [
        "ማውጫውን፣ መተግበሪያውን ወይም እነዚህን ደንቦች ልንቀይር እንችላለን። ከላይ ያለው ቀን የመጨረሻውን እትም ያሳያል፤ ለውጡ አስፈላጊ ከሆነ በድረ ገጹ ላይም እናሳውቃለን። ከለውጡ በኋላ ማውጫውን መጠቀም አዲሶቹን ደንቦች መቀበል ማለት ነው።",
      ],
    },
    {
      title: "ሕግና አድራሻ",
      body: [
        `እነዚህ ደንቦች በኢትዮጵያ ሕጎች ይመራሉ። ችግር ካጋጠመዎት እባክዎ መጀመሪያ ወደ ${email} ይጻፉ፦ አብዛኛው ችግር በዚህ መንገድ በፍጥነት ይፈታል። መረጃዎን እንዴት እንደምንይዝ በግላዊነት ፖሊሲው ውስጥ ተብራርቷል።`,
      ],
    },
  ],
};

export const terms: Record<Locale, Terms> = { en, am };

/** The line under the add and review forms (components/TermsNote.tsx). */
export const termsNote: Record<Locale, { before: string; link: string; after: string }> = {
  en: { before: "By sending, you agree to the ", link: "terms of use", after: "." },
  am: { before: "በመላክዎ በ", link: "የአጠቃቀም ደንቦቹ", after: " ይስማማሉ።" },
};
