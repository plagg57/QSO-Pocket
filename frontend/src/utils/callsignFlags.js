// Mapping of amateur radio callsign prefixes to country codes (ISO 3166-1 alpha-2)
const CALLSIGN_PREFIX_MAP = [
  // Longest prefixes first for correct matching
  { prefix: "HB9", cc: "ch" }, { prefix: "HB3", cc: "ch" },
  { prefix: "9A", cc: "hr" }, { prefix: "9H", cc: "mt" }, { prefix: "9K", cc: "kw" },
  { prefix: "3A", cc: "mc" }, { prefix: "3B", cc: "mu" },
  { prefix: "4X", cc: "il" }, { prefix: "4Z", cc: "il" },
  { prefix: "5B", cc: "cy" }, { prefix: "5N", cc: "ng" },
  { prefix: "7X", cc: "dz" },
  { prefix: "8P", cc: "bb" },
  { prefix: "A4", cc: "om" }, { prefix: "A6", cc: "ae" }, { prefix: "A7", cc: "qa" }, { prefix: "A9", cc: "bh" },
  { prefix: "C3", cc: "ad" }, { prefix: "CN", cc: "ma" }, { prefix: "CO", cc: "cu" },
  { prefix: "CT", cc: "pt" }, { prefix: "CU", cc: "pt" },
  { prefix: "DA", cc: "de" }, { prefix: "DB", cc: "de" }, { prefix: "DC", cc: "de" }, { prefix: "DD", cc: "de" },
  { prefix: "DE", cc: "de" }, { prefix: "DF", cc: "de" }, { prefix: "DG", cc: "de" }, { prefix: "DH", cc: "de" },
  { prefix: "DJ", cc: "de" }, { prefix: "DK", cc: "de" }, { prefix: "DL", cc: "de" }, { prefix: "DM", cc: "de" },
  { prefix: "DO", cc: "de" }, { prefix: "DP", cc: "de" }, { prefix: "DR", cc: "de" },
  { prefix: "EA", cc: "es" }, { prefix: "EB", cc: "es" }, { prefix: "EC", cc: "es" },
  { prefix: "EI", cc: "ie" }, { prefix: "EL", cc: "lr" }, { prefix: "EP", cc: "ir" },
  { prefix: "ER", cc: "md" }, { prefix: "ES", cc: "ee" }, { prefix: "ET", cc: "et" },
  { prefix: "EW", cc: "by" }, { prefix: "EX", cc: "kg" },
  { prefix: "F", cc: "fr" },
  { prefix: "G", cc: "gb" }, { prefix: "GD", cc: "gb" }, { prefix: "GI", cc: "gb" },
  { prefix: "GM", cc: "gb" }, { prefix: "GW", cc: "gb" }, { prefix: "M", cc: "gb" }, { prefix: "2E", cc: "gb" },
  { prefix: "HA", cc: "hu" }, { prefix: "HB", cc: "ch" }, { prefix: "HC", cc: "ec" },
  { prefix: "HI", cc: "do" }, { prefix: "HK", cc: "co" }, { prefix: "HL", cc: "kr" },
  { prefix: "HP", cc: "pa" }, { prefix: "HR", cc: "hn" }, { prefix: "HS", cc: "th" },
  { prefix: "HV", cc: "va" }, { prefix: "HZ", cc: "sa" },
  { prefix: "I", cc: "it" },
  { prefix: "JA", cc: "jp" }, { prefix: "JH", cc: "jp" }, { prefix: "JR", cc: "jp" },
  { prefix: "JE", cc: "jp" }, { prefix: "JF", cc: "jp" }, { prefix: "JG", cc: "jp" },
  { prefix: "JI", cc: "jp" }, { prefix: "JJ", cc: "jp" }, { prefix: "JK", cc: "jp" },
  { prefix: "JL", cc: "jp" }, { prefix: "JM", cc: "jp" }, { prefix: "JN", cc: "jp" },
  { prefix: "JO", cc: "jp" }, { prefix: "JP", cc: "jp" }, { prefix: "JQ", cc: "jp" },
  { prefix: "JS", cc: "jp" },
  { prefix: "K", cc: "us" }, { prefix: "N", cc: "us" }, { prefix: "W", cc: "us" },
  { prefix: "AA", cc: "us" }, { prefix: "AB", cc: "us" }, { prefix: "AC", cc: "us" },
  { prefix: "AD", cc: "us" }, { prefix: "AE", cc: "us" }, { prefix: "AF", cc: "us" },
  { prefix: "AG", cc: "us" }, { prefix: "AH", cc: "us" }, { prefix: "AI", cc: "us" },
  { prefix: "AJ", cc: "us" }, { prefix: "AK", cc: "us" }, { prefix: "AL", cc: "us" },
  { prefix: "KA", cc: "us" }, { prefix: "KB", cc: "us" }, { prefix: "KC", cc: "us" },
  { prefix: "KD", cc: "us" }, { prefix: "KE", cc: "us" }, { prefix: "KF", cc: "us" },
  { prefix: "KG", cc: "us" }, { prefix: "KH", cc: "us" }, { prefix: "KI", cc: "us" },
  { prefix: "KJ", cc: "us" }, { prefix: "KK", cc: "us" }, { prefix: "KL", cc: "us" },
  { prefix: "KM", cc: "us" }, { prefix: "KN", cc: "us" }, { prefix: "KO", cc: "us" },
  { prefix: "KP", cc: "us" }, { prefix: "KQ", cc: "us" }, { prefix: "KR", cc: "us" },
  { prefix: "KS", cc: "us" }, { prefix: "KT", cc: "us" }, { prefix: "KU", cc: "us" },
  { prefix: "KV", cc: "us" }, { prefix: "KW", cc: "us" }, { prefix: "KX", cc: "us" },
  { prefix: "KY", cc: "us" }, { prefix: "KZ", cc: "us" },
  { prefix: "LA", cc: "no" }, { prefix: "LB", cc: "no" },
  { prefix: "LU", cc: "ar" }, { prefix: "LX", cc: "lu" }, { prefix: "LY", cc: "lt" }, { prefix: "LZ", cc: "bg" },
  { prefix: "OE", cc: "at" }, { prefix: "OH", cc: "fi" }, { prefix: "OK", cc: "cz" },
  { prefix: "OM", cc: "sk" }, { prefix: "ON", cc: "be" }, { prefix: "OO", cc: "be" },
  { prefix: "OR", cc: "be" }, { prefix: "OS", cc: "be" }, { prefix: "OT", cc: "be" },
  { prefix: "OZ", cc: "dk" },
  { prefix: "PA", cc: "nl" }, { prefix: "PB", cc: "nl" }, { prefix: "PC", cc: "nl" },
  { prefix: "PD", cc: "nl" }, { prefix: "PE", cc: "nl" }, { prefix: "PH", cc: "nl" }, { prefix: "PI", cc: "nl" },
  { prefix: "PY", cc: "br" }, { prefix: "PP", cc: "br" }, { prefix: "PR", cc: "br" }, { prefix: "PS", cc: "br" }, { prefix: "PT", cc: "br" }, { prefix: "PU", cc: "br" },
  { prefix: "RA", cc: "ru" }, { prefix: "RK", cc: "ru" }, { prefix: "RN", cc: "ru" },
  { prefix: "RU", cc: "ru" }, { prefix: "RV", cc: "ru" }, { prefix: "RW", cc: "ru" },
  { prefix: "RX", cc: "ru" }, { prefix: "RZ", cc: "ru" },
  { prefix: "UA", cc: "ru" }, { prefix: "UB", cc: "ru" },
  { prefix: "S5", cc: "si" }, { prefix: "SM", cc: "se" }, { prefix: "SP", cc: "pl" },
  { prefix: "SQ", cc: "pl" }, { prefix: "SR", cc: "pl" },
  { prefix: "SU", cc: "eg" }, { prefix: "SV", cc: "gr" },
  { prefix: "TA", cc: "tr" }, { prefix: "TF", cc: "is" }, { prefix: "TG", cc: "gt" },
  { prefix: "TI", cc: "cr" },
  { prefix: "UK", cc: "uz" }, { prefix: "UN", cc: "kz" }, { prefix: "UR", cc: "ua" },
  { prefix: "UT", cc: "ua" }, { prefix: "UX", cc: "ua" }, { prefix: "UY", cc: "ua" },
  { prefix: "VE", cc: "ca" }, { prefix: "VA", cc: "ca" }, { prefix: "VB", cc: "ca" },
  { prefix: "VC", cc: "ca" }, { prefix: "VG", cc: "ca" }, { prefix: "VO", cc: "ca" }, { prefix: "VY", cc: "ca" },
  { prefix: "VK", cc: "au" },
  { prefix: "VR", cc: "hk" }, { prefix: "VU", cc: "in" },
  { prefix: "XE", cc: "mx" }, { prefix: "XF", cc: "mx" },
  { prefix: "YB", cc: "id" }, { prefix: "YC", cc: "id" }, { prefix: "YD", cc: "id" },
  { prefix: "YL", cc: "lv" }, { prefix: "YO", cc: "ro" }, { prefix: "YU", cc: "rs" },
  { prefix: "ZA", cc: "al" }, { prefix: "ZB", cc: "gi" },
  { prefix: "ZL", cc: "nz" }, { prefix: "ZP", cc: "py" },
  { prefix: "ZR", cc: "za" }, { prefix: "ZS", cc: "za" }, { prefix: "ZU", cc: "za" },
];

// Sort by prefix length descending so longer prefixes match first
CALLSIGN_PREFIX_MAP.sort((a, b) => b.prefix.length - a.prefix.length);

export function getCountryCode(callsign) {
  if (!callsign) return null;
  const upper = callsign.toUpperCase();
  for (const entry of CALLSIGN_PREFIX_MAP) {
    if (upper.startsWith(entry.prefix)) {
      return entry.cc;
    }
  }
  return null;
}

export function getFlagUrl(callsign, size = 24) {
  const cc = getCountryCode(callsign);
  if (!cc) return null;
  return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${cc}.png`;
}

export function getCountryName(callsign) {
  const COUNTRY_NAMES = {
    fr: "France", gb: "Royaume-Uni", de: "Allemagne", es: "Espagne", it: "Italie",
    be: "Belgique", nl: "Pays-Bas", ch: "Suisse", at: "Autriche", pt: "Portugal",
    us: "États-Unis", ca: "Canada", jp: "Japon", au: "Australie", nz: "Nouvelle-Zélande",
    br: "Brésil", ar: "Argentine", ru: "Russie", ua: "Ukraine", pl: "Pologne",
    cz: "Tchéquie", sk: "Slovaquie", hu: "Hongrie", ro: "Roumanie", bg: "Bulgarie",
    hr: "Croatie", si: "Slovénie", rs: "Serbie", gr: "Grèce", tr: "Turquie",
    se: "Suède", no: "Norvège", dk: "Danemark", fi: "Finlande", ie: "Irlande",
    lu: "Luxembourg", lt: "Lituanie", lv: "Lettonie", ee: "Estonie", is: "Islande",
    za: "Afrique du Sud", eg: "Égypte", ma: "Maroc", dz: "Algérie", ng: "Nigeria",
    kr: "Corée du Sud", th: "Thaïlande", in: "Inde", hk: "Hong Kong", mx: "Mexique",
    co: "Colombie", ec: "Équateur", pa: "Panama", cr: "Costa Rica", gt: "Guatemala",
    cu: "Cuba", do: "Rép. dominicaine", hn: "Honduras", py: "Paraguay",
    id: "Indonésie", sa: "Arabie saoudite", ae: "Émirats arabes unis", qa: "Qatar",
    kw: "Koweït", bh: "Bahreïn", om: "Oman", il: "Israël", ir: "Iran",
    kz: "Kazakhstan", kg: "Kirghizstan", uz: "Ouzbékistan", by: "Biélorussie",
    md: "Moldavie", mc: "Monaco", ad: "Andorre", va: "Vatican", mt: "Malte",
    cy: "Chypre", al: "Albanie", gi: "Gibraltar", mu: "Maurice", bb: "Barbade",
    lr: "Libéria", et: "Éthiopie",
  };
  const cc = getCountryCode(callsign);
  return cc ? COUNTRY_NAMES[cc] || cc.toUpperCase() : null;
}
