// Mapping of amateur radio callsign prefixes to country codes (ISO 3166-1 alpha-2)
const CALLSIGN_PREFIX_MAP = [
  // === France métropolitaine + DOM-TOM ===
  { prefix: "TK", cc: "fr" },   // Corse
  { prefix: "FG", cc: "fr" },   // Guadeloupe
  { prefix: "FM", cc: "fr" },   // Martinique
  { prefix: "FR", cc: "fr" },   // Réunion
  { prefix: "FY", cc: "fr" },   // Guyane française
  { prefix: "FO", cc: "fr" },   // Polynésie française
  { prefix: "FK", cc: "fr" },   // Nouvelle-Calédonie
  { prefix: "FW", cc: "fr" },   // Wallis-et-Futuna
  { prefix: "FH", cc: "fr" },   // Mayotte
  { prefix: "FP", cc: "fr" },   // Saint-Pierre-et-Miquelon
  { prefix: "FS", cc: "fr" },   // Saint-Martin
  { prefix: "FT", cc: "fr" },   // Terres australes
  { prefix: "F", cc: "fr" },    // France métropolitaine

  // === Suisse ===
  { prefix: "HB9", cc: "ch" }, { prefix: "HB3", cc: "ch" },
  { prefix: "HE", cc: "ch" },

  // === Préfixes numériques ===
  { prefix: "3A", cc: "mc" },   // Monaco
  { prefix: "3B8", cc: "mu" },  // Maurice
  { prefix: "3B9", cc: "mu" },  // Rodrigues
  { prefix: "3B", cc: "mu" },
  { prefix: "3C", cc: "gq" },   // Guinée équatoriale
  { prefix: "3D", cc: "sz" },   // Eswatini
  { prefix: "3V", cc: "tn" },   // Tunisie
  { prefix: "3W", cc: "vn" },   // Vietnam
  { prefix: "3X", cc: "gn" },   // Guinée
  { prefix: "4J", cc: "az" },   // Azerbaïdjan
  { prefix: "4L", cc: "ge" },   // Géorgie
  { prefix: "4O", cc: "me" },   // Monténégro
  { prefix: "4S", cc: "lk" },   // Sri Lanka
  { prefix: "4U", cc: "un" },   // ONU
  { prefix: "4X", cc: "il" }, { prefix: "4Z", cc: "il" }, // Israël
  { prefix: "5A", cc: "ly" },   // Libye
  { prefix: "5B", cc: "cy" },   // Chypre
  { prefix: "5H", cc: "tz" },   // Tanzanie
  { prefix: "5N", cc: "ng" },   // Nigeria
  { prefix: "5R", cc: "mg" },   // Madagascar
  { prefix: "5T", cc: "mr" },   // Mauritanie
  { prefix: "5U", cc: "ne" },   // Niger
  { prefix: "5V", cc: "tg" },   // Togo
  { prefix: "5W", cc: "ws" },   // Samoa
  { prefix: "5X", cc: "ug" },   // Ouganda
  { prefix: "5Z", cc: "ke" },   // Kenya
  { prefix: "6W", cc: "sn" },   // Sénégal
  { prefix: "6Y", cc: "jm" },   // Jamaïque
  { prefix: "7O", cc: "ye" },   // Yémen
  { prefix: "7P", cc: "ls" },   // Lesotho
  { prefix: "7Q", cc: "mw" },   // Malawi
  { prefix: "7X", cc: "dz" },   // Algérie
  { prefix: "8P", cc: "bb" },   // Barbade
  { prefix: "8Q", cc: "mv" },   // Maldives
  { prefix: "8R", cc: "gy" },   // Guyana
  { prefix: "9A", cc: "hr" },   // Croatie
  { prefix: "9G", cc: "gh" },   // Ghana
  { prefix: "9H", cc: "mt" },   // Malte
  { prefix: "9J", cc: "zm" },   // Zambie
  { prefix: "9K", cc: "kw" },   // Koweït
  { prefix: "9L", cc: "sl" },   // Sierra Leone
  { prefix: "9M", cc: "my" },   // Malaisie
  { prefix: "9N", cc: "np" },   // Népal
  { prefix: "9Q", cc: "cd" },   // RD Congo
  { prefix: "9U", cc: "bi" },   // Burundi
  { prefix: "9V", cc: "sg" },   // Singapour
  { prefix: "9X", cc: "rw" },   // Rwanda
  { prefix: "9Y", cc: "tt" },   // Trinité-et-Tobago

  // === A ===
  { prefix: "A2", cc: "bw" },   // Botswana
  { prefix: "A3", cc: "to" },   // Tonga
  { prefix: "A4", cc: "om" },   // Oman
  { prefix: "A5", cc: "bt" },   // Bhoutan
  { prefix: "A6", cc: "ae" },   // Émirats arabes unis
  { prefix: "A7", cc: "qa" },   // Qatar
  { prefix: "A9", cc: "bh" },   // Bahreïn
  { prefix: "AP", cc: "pk" },   // Pakistan

  // === C ===
  { prefix: "C2", cc: "nr" },   // Nauru
  { prefix: "C3", cc: "ad" },   // Andorre
  { prefix: "C5", cc: "gm" },   // Gambie
  { prefix: "C6", cc: "bs" },   // Bahamas
  { prefix: "C9", cc: "mz" },   // Mozambique
  { prefix: "CE", cc: "cl" },   // Chili
  { prefix: "CN", cc: "ma" },   // Maroc
  { prefix: "CO", cc: "cu" },   // Cuba
  { prefix: "CP", cc: "bo" },   // Bolivie
  { prefix: "CT", cc: "pt" }, { prefix: "CU", cc: "pt" }, // Portugal
  { prefix: "CX", cc: "uy" },   // Uruguay

  // === D ===
  { prefix: "DA", cc: "de" }, { prefix: "DB", cc: "de" }, { prefix: "DC", cc: "de" }, { prefix: "DD", cc: "de" },
  { prefix: "DE", cc: "de" }, { prefix: "DF", cc: "de" }, { prefix: "DG", cc: "de" }, { prefix: "DH", cc: "de" },
  { prefix: "DJ", cc: "de" }, { prefix: "DK", cc: "de" }, { prefix: "DL", cc: "de" }, { prefix: "DM", cc: "de" },
  { prefix: "DO", cc: "de" }, { prefix: "DP", cc: "de" }, { prefix: "DR", cc: "de" },
  { prefix: "D2", cc: "ao" },   // Angola
  { prefix: "D4", cc: "cv" },   // Cap-Vert
  { prefix: "D6", cc: "km" },   // Comores
  { prefix: "DU", cc: "ph" },   // Philippines

  // === E ===
  { prefix: "E5", cc: "ck" },   // Îles Cook
  { prefix: "E7", cc: "ba" },   // Bosnie-Herzégovine
  { prefix: "EA", cc: "es" }, { prefix: "EB", cc: "es" }, { prefix: "EC", cc: "es" }, // Espagne
  { prefix: "ED", cc: "es" }, { prefix: "EE", cc: "es" }, { prefix: "EF", cc: "es" },
  { prefix: "EH", cc: "es" },   // Sahara occidental (Espagne)
  { prefix: "EI", cc: "ie" },   // Irlande
  { prefix: "EK", cc: "am" },   // Arménie
  { prefix: "EL", cc: "lr" },   // Liberia
  { prefix: "EP", cc: "ir" },   // Iran
  { prefix: "ER", cc: "md" },   // Moldavie
  { prefix: "ES", cc: "ee" },   // Estonie
  { prefix: "ET", cc: "et" },   // Éthiopie
  { prefix: "EW", cc: "by" },   // Biélorussie
  { prefix: "EX", cc: "kg" },   // Kirghizstan

  // === G / UK ===
  { prefix: "GD", cc: "gb" },   // Île de Man
  { prefix: "GI", cc: "gb" },   // Irlande du Nord
  { prefix: "GJ", cc: "gb" },   // Jersey
  { prefix: "GM", cc: "gb" },   // Écosse
  { prefix: "GU", cc: "gb" },   // Guernesey
  { prefix: "GW", cc: "gb" },   // Pays de Galles
  { prefix: "G", cc: "gb" },    // Angleterre
  { prefix: "M", cc: "gb" },    // UK
  { prefix: "2E", cc: "gb" }, { prefix: "2D", cc: "gb" }, { prefix: "2I", cc: "gb" },
  { prefix: "2M", cc: "gb" }, { prefix: "2W", cc: "gb" },

  // === H ===
  { prefix: "HA", cc: "hu" }, { prefix: "HG", cc: "hu" }, // Hongrie
  { prefix: "HB", cc: "ch" },   // Suisse (fallback)
  { prefix: "HC", cc: "ec" },   // Équateur
  { prefix: "HI", cc: "do" },   // Rép. dominicaine
  { prefix: "HK", cc: "co" },   // Colombie
  { prefix: "HL", cc: "kr" },   // Corée du Sud
  { prefix: "HP", cc: "pa" },   // Panama
  { prefix: "HR", cc: "hn" },   // Honduras
  { prefix: "HS", cc: "th" },   // Thaïlande
  { prefix: "HV", cc: "va" },   // Vatican
  { prefix: "HZ", cc: "sa" },   // Arabie saoudite
  { prefix: "H4", cc: "sb" },   // Îles Salomon

  // === I ===
  { prefix: "IT9", cc: "it" },  // Sicile
  { prefix: "IS", cc: "it" },   // Sardaigne
  { prefix: "I", cc: "it" },    // Italie

  // === J ===
  { prefix: "JA", cc: "jp" }, { prefix: "JH", cc: "jp" }, { prefix: "JR", cc: "jp" },
  { prefix: "JE", cc: "jp" }, { prefix: "JF", cc: "jp" }, { prefix: "JG", cc: "jp" },
  { prefix: "JI", cc: "jp" }, { prefix: "JJ", cc: "jp" }, { prefix: "JK", cc: "jp" },
  { prefix: "JL", cc: "jp" }, { prefix: "JM", cc: "jp" }, { prefix: "JN", cc: "jp" },
  { prefix: "JO", cc: "jp" }, { prefix: "JP", cc: "jp" }, { prefix: "JQ", cc: "jp" },
  { prefix: "JS", cc: "jp" },
  { prefix: "JT", cc: "mn" },   // Mongolie
  { prefix: "JW", cc: "no" },   // Svalbard
  { prefix: "JX", cc: "no" },   // Jan Mayen
  { prefix: "JY", cc: "jo" },   // Jordanie
  { prefix: "J2", cc: "dj" },   // Djibouti
  { prefix: "J3", cc: "gd" },   // Grenade
  { prefix: "J5", cc: "gw" },   // Guinée-Bissau
  { prefix: "J6", cc: "lc" },   // Sainte-Lucie
  { prefix: "J7", cc: "dm" },   // Dominique
  { prefix: "J8", cc: "vc" },   // Saint-Vincent

  // === K, N, W = USA ===
  { prefix: "K", cc: "us" }, { prefix: "N", cc: "us" }, { prefix: "W", cc: "us" },
  { prefix: "AA", cc: "us" }, { prefix: "AB", cc: "us" }, { prefix: "AC", cc: "us" },
  { prefix: "AD", cc: "us" }, { prefix: "AE", cc: "us" }, { prefix: "AF", cc: "us" },
  { prefix: "AG", cc: "us" }, { prefix: "AH", cc: "us" }, { prefix: "AI", cc: "us" },
  { prefix: "AJ", cc: "us" }, { prefix: "AK", cc: "us" }, { prefix: "AL", cc: "us" },

  // === L ===
  { prefix: "LA", cc: "no" }, { prefix: "LB", cc: "no" }, // Norvège
  { prefix: "LU", cc: "ar" },   // Argentine
  { prefix: "LX", cc: "lu" },   // Luxembourg
  { prefix: "LY", cc: "lt" },   // Lituanie
  { prefix: "LZ", cc: "bg" },   // Bulgarie

  // === O ===
  { prefix: "OE", cc: "at" },   // Autriche
  { prefix: "OF", cc: "fi" }, { prefix: "OG", cc: "fi" }, { prefix: "OH", cc: "fi" }, { prefix: "OI", cc: "fi" }, // Finlande
  { prefix: "OK", cc: "cz" }, { prefix: "OL", cc: "cz" }, // Tchéquie
  { prefix: "OM", cc: "sk" },   // Slovaquie
  { prefix: "ON", cc: "be" }, { prefix: "OO", cc: "be" }, { prefix: "OP", cc: "be" },
  { prefix: "OQ", cc: "be" }, { prefix: "OR", cc: "be" }, { prefix: "OS", cc: "be" }, { prefix: "OT", cc: "be" }, // Belgique
  { prefix: "OX", cc: "gl" },   // Groenland
  { prefix: "OY", cc: "fo" },   // Îles Féroé
  { prefix: "OZ", cc: "dk" },   // Danemark

  // === P ===
  { prefix: "PA", cc: "nl" }, { prefix: "PB", cc: "nl" }, { prefix: "PC", cc: "nl" },
  { prefix: "PD", cc: "nl" }, { prefix: "PE", cc: "nl" }, { prefix: "PH", cc: "nl" }, { prefix: "PI", cc: "nl" }, // Pays-Bas
  { prefix: "PJ", cc: "nl" },   // Antilles néerlandaises
  { prefix: "PY", cc: "br" }, { prefix: "PP", cc: "br" }, { prefix: "PR", cc: "br" },
  { prefix: "PS", cc: "br" }, { prefix: "PT", cc: "br" }, { prefix: "PU", cc: "br" }, // Brésil
  { prefix: "PZ", cc: "sr" },   // Suriname

  // === R / U = Russie ===
  { prefix: "RA", cc: "ru" }, { prefix: "RK", cc: "ru" }, { prefix: "RN", cc: "ru" },
  { prefix: "RU", cc: "ru" }, { prefix: "RV", cc: "ru" }, { prefix: "RW", cc: "ru" },
  { prefix: "RX", cc: "ru" }, { prefix: "RZ", cc: "ru" },
  { prefix: "R", cc: "ru" },
  { prefix: "UA", cc: "ru" }, { prefix: "UB", cc: "ru" },

  // === S ===
  { prefix: "S2", cc: "bd" },   // Bangladesh
  { prefix: "S5", cc: "si" },   // Slovénie
  { prefix: "S7", cc: "sc" },   // Seychelles
  { prefix: "S9", cc: "st" },   // São Tomé
  { prefix: "SA", cc: "se" }, { prefix: "SB", cc: "se" }, { prefix: "SC", cc: "se" },
  { prefix: "SD", cc: "se" }, { prefix: "SE", cc: "se" }, { prefix: "SF", cc: "se" },
  { prefix: "SG", cc: "se" }, { prefix: "SH", cc: "se" }, { prefix: "SI", cc: "se" },
  { prefix: "SJ", cc: "se" }, { prefix: "SK", cc: "se" }, { prefix: "SL", cc: "se" }, { prefix: "SM", cc: "se" }, // Suède
  { prefix: "SN", cc: "pl" }, { prefix: "SO", cc: "pl" }, { prefix: "SP", cc: "pl" },
  { prefix: "SQ", cc: "pl" }, { prefix: "SR", cc: "pl" }, // Pologne
  { prefix: "ST", cc: "sd" },   // Soudan
  { prefix: "SU", cc: "eg" },   // Égypte
  { prefix: "SV", cc: "gr" }, { prefix: "SW", cc: "gr" }, { prefix: "SX", cc: "gr" }, { prefix: "SY", cc: "gr" }, { prefix: "SZ", cc: "gr" }, // Grèce

  // === T ===
  { prefix: "TA", cc: "tr" }, { prefix: "TB", cc: "tr" }, { prefix: "TC", cc: "tr" }, // Turquie
  { prefix: "TF", cc: "is" },   // Islande
  { prefix: "TG", cc: "gt" },   // Guatemala
  { prefix: "TI", cc: "cr" },   // Costa Rica
  { prefix: "TJ", cc: "cm" },   // Cameroun
  { prefix: "TL", cc: "cf" },   // Centrafrique
  { prefix: "TN", cc: "cg" },   // Congo
  { prefix: "TR", cc: "ga" },   // Gabon
  { prefix: "TS", cc: "tn" },   // Tunisie
  { prefix: "TT", cc: "td" },   // Tchad
  { prefix: "TU", cc: "ci" },   // Côte d'Ivoire
  { prefix: "TY", cc: "bj" },   // Bénin
  { prefix: "TZ", cc: "ml" },   // Mali
  { prefix: "T7", cc: "sm" },   // Saint-Marin
  { prefix: "T8", cc: "pw" },   // Palaos
  { prefix: "T9", cc: "ba" },   // Bosnie

  // === U = Ukraine, Ouzbékistan, Kazakhstan ===
  { prefix: "UK", cc: "uz" },   // Ouzbékistan
  { prefix: "UN", cc: "kz" }, { prefix: "UP", cc: "kz" }, // Kazakhstan
  { prefix: "UR", cc: "ua" }, { prefix: "US", cc: "ua" }, { prefix: "UT", cc: "ua" },
  { prefix: "UX", cc: "ua" }, { prefix: "UY", cc: "ua" }, { prefix: "UZ", cc: "ua" }, // Ukraine

  // === V ===
  { prefix: "V2", cc: "ag" },   // Antigua-et-Barbuda
  { prefix: "V3", cc: "bz" },   // Belize
  { prefix: "V4", cc: "kn" },   // Saint-Kitts
  { prefix: "V5", cc: "na" },   // Namibie
  { prefix: "V6", cc: "fm" },   // Micronésie
  { prefix: "V7", cc: "mh" },   // Îles Marshall
  { prefix: "V8", cc: "bn" },   // Brunei
  { prefix: "VA", cc: "ca" }, { prefix: "VB", cc: "ca" }, { prefix: "VC", cc: "ca" },
  { prefix: "VE", cc: "ca" }, { prefix: "VG", cc: "ca" }, { prefix: "VO", cc: "ca" }, { prefix: "VY", cc: "ca" }, // Canada
  { prefix: "VK", cc: "au" },   // Australie
  { prefix: "VP2E", cc: "ai" }, // Anguilla
  { prefix: "VP2M", cc: "ms" }, // Montserrat
  { prefix: "VP2V", cc: "vg" }, // Îles Vierges britanniques
  { prefix: "VP5", cc: "tc" },  // Turques-et-Caïques
  { prefix: "VP8", cc: "fk" },  // Falkland
  { prefix: "VP9", cc: "bm" },  // Bermudes
  { prefix: "VR", cc: "hk" },   // Hong Kong
  { prefix: "VU", cc: "in" },   // Inde

  // === X ===
  { prefix: "XE", cc: "mx" }, { prefix: "XF", cc: "mx" }, // Mexique
  { prefix: "XT", cc: "bf" },   // Burkina Faso
  { prefix: "XU", cc: "kh" },   // Cambodge
  { prefix: "XW", cc: "la" },   // Laos
  { prefix: "XZ", cc: "mm" },   // Myanmar

  // === Y ===
  { prefix: "YA", cc: "af" },   // Afghanistan
  { prefix: "YB", cc: "id" }, { prefix: "YC", cc: "id" }, { prefix: "YD", cc: "id" },
  { prefix: "YE", cc: "id" }, { prefix: "YF", cc: "id" }, { prefix: "YG", cc: "id" }, { prefix: "YH", cc: "id" }, // Indonésie
  { prefix: "YI", cc: "iq" },   // Irak
  { prefix: "YJ", cc: "vu" },   // Vanuatu
  { prefix: "YK", cc: "sy" },   // Syrie
  { prefix: "YL", cc: "lv" },   // Lettonie
  { prefix: "YN", cc: "ni" },   // Nicaragua
  { prefix: "YO", cc: "ro" }, { prefix: "YP", cc: "ro" }, { prefix: "YQ", cc: "ro" }, { prefix: "YR", cc: "ro" }, // Roumanie
  { prefix: "YS", cc: "sv" },   // Salvador
  { prefix: "YT", cc: "rs" }, { prefix: "YU", cc: "rs" }, // Serbie
  { prefix: "YV", cc: "ve" },   // Venezuela

  // === Z ===
  { prefix: "Z2", cc: "zw" },   // Zimbabwe
  { prefix: "Z3", cc: "mk" },   // Macédoine du Nord
  { prefix: "Z6", cc: "xk" },   // Kosovo
  { prefix: "Z8", cc: "ss" },   // Soudan du Sud
  { prefix: "ZA", cc: "al" },   // Albanie
  { prefix: "ZB", cc: "gi" },   // Gibraltar
  { prefix: "ZD7", cc: "sh" },  // Sainte-Hélène
  { prefix: "ZD8", cc: "ac" },  // Ascension
  { prefix: "ZF", cc: "ky" },   // Îles Caïmans
  { prefix: "ZL", cc: "nz" },   // Nouvelle-Zélande
  { prefix: "ZP", cc: "py" },   // Paraguay
  { prefix: "ZR", cc: "za" }, { prefix: "ZS", cc: "za" }, { prefix: "ZT", cc: "za" }, { prefix: "ZU", cc: "za" }, // Afrique du Sud
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
    lr: "Libéria", et: "Éthiopie", tn: "Tunisie", vn: "Vietnam", gn: "Guinée",
    az: "Azerbaïdjan", ge: "Géorgie", me: "Monténégro", lk: "Sri Lanka",
    ly: "Libye", tz: "Tanzanie", mg: "Madagascar", mr: "Mauritanie", ne: "Niger",
    tg: "Togo", ws: "Samoa", ug: "Ouganda", ke: "Kenya", sn: "Sénégal",
    jm: "Jamaïque", ye: "Yémen", ls: "Lesotho", mw: "Malawi", mv: "Maldives",
    gy: "Guyana", gh: "Ghana", zm: "Zambie", sl: "Sierra Leone", my: "Malaisie",
    np: "Népal", cd: "RD Congo", bi: "Burundi", sg: "Singapour", rw: "Rwanda",
    tt: "Trinité-et-Tobago", bw: "Botswana", to: "Tonga", bt: "Bhoutan",
    pk: "Pakistan", nr: "Nauru", gm: "Gambie", bs: "Bahamas", mz: "Mozambique",
    cl: "Chili", bo: "Bolivie", uy: "Uruguay", sr: "Suriname", ph: "Philippines",
    ao: "Angola", cv: "Cap-Vert", km: "Comores", ba: "Bosnie-Herzégovine",
    am: "Arménie", jo: "Jordanie", dj: "Djibouti", gd: "Grenade", gw: "Guinée-Bissau",
    lc: "Sainte-Lucie", dm: "Dominique", vc: "Saint-Vincent",
    mn: "Mongolie", fo: "Îles Féroé", gl: "Groenland", bd: "Bangladesh",
    sc: "Seychelles", st: "São Tomé", sd: "Soudan", sm: "Saint-Marin",
    pw: "Palaos", ag: "Antigua-et-Barbuda", bz: "Belize", kn: "Saint-Kitts",
    na: "Namibie", fm: "Micronésie", mh: "Îles Marshall", bn: "Brunei",
    ai: "Anguilla", ms: "Montserrat", vg: "Îles Vierges brit.", tc: "Turques-et-Caïques",
    fk: "Falkland", bm: "Bermudes", bf: "Burkina Faso", kh: "Cambodge",
    la: "Laos", mm: "Myanmar", af: "Afghanistan", iq: "Irak", vu: "Vanuatu",
    sy: "Syrie", ni: "Nicaragua", sv: "Salvador", ve: "Venezuela",
    zw: "Zimbabwe", mk: "Macédoine du Nord", xk: "Kosovo", ss: "Soudan du Sud",
    sh: "Sainte-Hélène", ky: "Îles Caïmans", gq: "Guinée équatoriale",
    sz: "Eswatini", cm: "Cameroun", cf: "Centrafrique", cg: "Congo",
    ga: "Gabon", td: "Tchad", ci: "Côte d'Ivoire", bj: "Bénin", ml: "Mali",
    ck: "Îles Cook", sb: "Îles Salomon",
  };
  const cc = getCountryCode(callsign);
  return cc ? COUNTRY_NAMES[cc] || cc.toUpperCase() : null;
}
