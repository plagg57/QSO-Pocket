// Comprehensive DXCC / ITU amateur radio prefix → country code mapping
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

  // === Préfixes numériques (2x) ===
  { prefix: "2E", cc: "gb" }, { prefix: "2D", cc: "gb" }, { prefix: "2I", cc: "gb" },
  { prefix: "2M", cc: "gb" }, { prefix: "2W", cc: "gb" },

  // === Préfixes numériques (3x) ===
  { prefix: "3A", cc: "mc" },   // Monaco
  { prefix: "3B8", cc: "mu" },  // Maurice
  { prefix: "3B9", cc: "mu" },  // Rodrigues
  { prefix: "3B", cc: "mu" },
  { prefix: "3C0", cc: "gq" },  // Annobon
  { prefix: "3C", cc: "gq" },   // Guinée équatoriale
  { prefix: "3DA", cc: "sz" },  // Eswatini
  { prefix: "3D", cc: "sz" },
  { prefix: "3V", cc: "tn" },   // Tunisie
  { prefix: "3W", cc: "vn" },   // Vietnam
  { prefix: "3X", cc: "gn" },   // Guinée

  // === Préfixes numériques (4x) ===
  { prefix: "4D", cc: "ph" }, { prefix: "4E", cc: "ph" }, { prefix: "4F", cc: "ph" },
  { prefix: "4G", cc: "ph" }, { prefix: "4H", cc: "ph" }, { prefix: "4I", cc: "ph" }, // Philippines
  { prefix: "4J", cc: "az" },   // Azerbaïdjan
  { prefix: "4K", cc: "az" },   // Azerbaïdjan
  { prefix: "4L", cc: "ge" },   // Géorgie
  { prefix: "4O", cc: "me" },   // Monténégro
  { prefix: "4S", cc: "lk" },   // Sri Lanka
  { prefix: "4U", cc: "un" },   // ONU
  { prefix: "4X", cc: "il" }, { prefix: "4Z", cc: "il" }, // Israël

  // === Préfixes numériques (5x) ===
  { prefix: "5A", cc: "ly" },   // Libye
  { prefix: "5B", cc: "cy" },   // Chypre
  { prefix: "5H", cc: "tz" }, { prefix: "5I", cc: "tz" }, // Tanzanie
  { prefix: "5N", cc: "ng" }, { prefix: "5O", cc: "ng" }, // Nigeria
  { prefix: "5R", cc: "mg" }, { prefix: "5S", cc: "mg" }, // Madagascar
  { prefix: "5T", cc: "mr" },   // Mauritanie
  { prefix: "5U", cc: "ne" },   // Niger
  { prefix: "5V", cc: "tg" },   // Togo
  { prefix: "5W", cc: "ws" },   // Samoa
  { prefix: "5X", cc: "ug" },   // Ouganda
  { prefix: "5Z", cc: "ke" },   // Kenya

  // === Préfixes numériques (6x) ===
  { prefix: "6K", cc: "kr" }, { prefix: "6L", cc: "kr" }, { prefix: "6M", cc: "kr" }, { prefix: "6N", cc: "kr" }, // Corée du Sud
  { prefix: "6O", cc: "so" },   // Somalie
  { prefix: "6V", cc: "sn" }, { prefix: "6W", cc: "sn" }, // Sénégal
  { prefix: "6Y", cc: "jm" },   // Jamaïque

  // === Préfixes numériques (7x) ===
  { prefix: "7J", cc: "jp" }, { prefix: "7K", cc: "jp" }, { prefix: "7L", cc: "jp" },
  { prefix: "7M", cc: "jp" }, { prefix: "7N", cc: "jp" }, // Japon
  { prefix: "7O", cc: "ye" },   // Yémen
  { prefix: "7P", cc: "ls" },   // Lesotho
  { prefix: "7Q", cc: "mw" },   // Malawi
  { prefix: "7R", cc: "dz" }, { prefix: "7T", cc: "dz" }, { prefix: "7U", cc: "dz" },
  { prefix: "7V", cc: "dz" }, { prefix: "7W", cc: "dz" }, { prefix: "7X", cc: "dz" },
  { prefix: "7Y", cc: "dz" },   // Algérie

  // === Préfixes numériques (8x) ===
  { prefix: "8J", cc: "jp" }, { prefix: "8K", cc: "jp" }, { prefix: "8L", cc: "jp" },
  { prefix: "8M", cc: "jp" }, { prefix: "8N", cc: "jp" }, // Japon
  { prefix: "8P", cc: "bb" },   // Barbade
  { prefix: "8Q", cc: "mv" },   // Maldives
  { prefix: "8R", cc: "gy" },   // Guyana
  { prefix: "8S", cc: "se" },   // Suède (special)

  // === Préfixes numériques (9x) ===
  { prefix: "9A", cc: "hr" },   // Croatie
  { prefix: "9G", cc: "gh" },   // Ghana
  { prefix: "9H", cc: "mt" },   // Malte
  { prefix: "9I", cc: "zm" }, { prefix: "9J", cc: "zm" }, // Zambie
  { prefix: "9K", cc: "kw" },   // Koweït
  { prefix: "9L", cc: "sl" },   // Sierra Leone
  { prefix: "9M", cc: "my" },   // Malaisie
  { prefix: "9N", cc: "np" },   // Népal
  { prefix: "9Q", cc: "cd" }, { prefix: "9R", cc: "cd" }, { prefix: "9S", cc: "cd" }, { prefix: "9T", cc: "cd" }, // RD Congo
  { prefix: "9U", cc: "bi" },   // Burundi
  { prefix: "9V", cc: "sg" },   // Singapour
  { prefix: "9W", cc: "my" },   // Malaisie
  { prefix: "9X", cc: "rw" },   // Rwanda
  { prefix: "9Y", cc: "tt" }, { prefix: "9Z", cc: "tt" }, // Trinité-et-Tobago

  // === A ===
  { prefix: "A2", cc: "bw" },   // Botswana
  { prefix: "A3", cc: "to" },   // Tonga
  { prefix: "A4", cc: "om" },   // Oman
  { prefix: "A5", cc: "bt" },   // Bhoutan
  { prefix: "A6", cc: "ae" },   // Émirats arabes unis
  { prefix: "A7", cc: "qa" },   // Qatar
  { prefix: "A9", cc: "bh" },   // Bahreïn
  { prefix: "AM", cc: "es" }, { prefix: "AN", cc: "es" }, { prefix: "AO", cc: "es" }, // Espagne (special)
  { prefix: "AP", cc: "pk" }, { prefix: "AQ", cc: "pk" }, { prefix: "AR", cc: "pk" }, { prefix: "AS", cc: "pk" }, // Pakistan
  // USA (AA-AL)
  { prefix: "AA", cc: "us" }, { prefix: "AB", cc: "us" }, { prefix: "AC", cc: "us" },
  { prefix: "AD", cc: "us" }, { prefix: "AE", cc: "us" }, { prefix: "AF", cc: "us" },
  { prefix: "AG", cc: "us" }, { prefix: "AH", cc: "us" }, { prefix: "AI", cc: "us" },
  { prefix: "AJ", cc: "us" }, { prefix: "AK", cc: "us" }, { prefix: "AL", cc: "us" },

  // === B === China & Taiwan
  { prefix: "BM", cc: "tw" }, { prefix: "BN", cc: "tw" }, { prefix: "BO", cc: "tw" },
  { prefix: "BP", cc: "tw" }, { prefix: "BQ", cc: "tw" }, { prefix: "BV", cc: "tw" },
  { prefix: "BW", cc: "tw" }, { prefix: "BX", cc: "tw" }, // Taïwan
  { prefix: "BY", cc: "cn" }, { prefix: "BA", cc: "cn" }, { prefix: "BB", cc: "cn" },
  { prefix: "BC", cc: "cn" }, { prefix: "BD", cc: "cn" }, { prefix: "BE", cc: "cn" },
  { prefix: "BF", cc: "cn" }, { prefix: "BG", cc: "cn" }, { prefix: "BH", cc: "cn" },
  { prefix: "BI", cc: "cn" }, { prefix: "BJ", cc: "cn" }, { prefix: "BK", cc: "cn" },
  { prefix: "BL", cc: "cn" }, { prefix: "BR", cc: "cn" }, { prefix: "BS", cc: "cn" },
  { prefix: "BT", cc: "cn" }, { prefix: "BU", cc: "cn" }, { prefix: "BZ", cc: "cn" },
  { prefix: "B", cc: "cn" },    // Chine (fallback)

  // === C ===
  { prefix: "C2", cc: "nr" },   // Nauru
  { prefix: "C3", cc: "ad" },   // Andorre
  { prefix: "C5", cc: "gm" },   // Gambie
  { prefix: "C6", cc: "bs" },   // Bahamas
  { prefix: "C9", cc: "mz" },   // Mozambique
  { prefix: "CE", cc: "cl" }, { prefix: "CA", cc: "cl" }, { prefix: "CB", cc: "cl" },
  { prefix: "CC", cc: "cl" }, { prefix: "CD", cc: "cl" }, // Chili
  { prefix: "CF", cc: "ca" }, { prefix: "CG", cc: "ca" }, { prefix: "CH", cc: "ca" },
  { prefix: "CI", cc: "ca" }, { prefix: "CJ", cc: "ca" }, { prefix: "CK", cc: "ca" },
  { prefix: "CY", cc: "ca" }, { prefix: "CZ", cc: "ca" }, // Canada
  { prefix: "CN", cc: "ma" },   // Maroc
  { prefix: "CO", cc: "cu" },   // Cuba
  { prefix: "CP", cc: "bo" },   // Bolivie
  { prefix: "CR", cc: "pt" }, { prefix: "CS", cc: "pt" }, { prefix: "CT", cc: "pt" }, { prefix: "CU", cc: "pt" }, // Portugal
  { prefix: "CX", cc: "uy" },   // Uruguay

  // === D ===
  { prefix: "DA", cc: "de" }, { prefix: "DB", cc: "de" }, { prefix: "DC", cc: "de" }, { prefix: "DD", cc: "de" },
  { prefix: "DE", cc: "de" }, { prefix: "DF", cc: "de" }, { prefix: "DG", cc: "de" }, { prefix: "DH", cc: "de" },
  { prefix: "DI", cc: "ph" },   // Philippines
  { prefix: "DJ", cc: "de" }, { prefix: "DK", cc: "de" }, { prefix: "DL", cc: "de" }, { prefix: "DM", cc: "de" },
  { prefix: "DO", cc: "de" }, { prefix: "DP", cc: "de" }, { prefix: "DR", cc: "de" },
  { prefix: "DS", cc: "kr" }, { prefix: "DT", cc: "kr" }, // Corée du Sud
  { prefix: "DU", cc: "ph" }, { prefix: "DV", cc: "ph" }, { prefix: "DW", cc: "ph" },
  { prefix: "DX", cc: "ph" }, { prefix: "DY", cc: "ph" }, { prefix: "DZ", cc: "ph" }, // Philippines
  { prefix: "D2", cc: "ao" }, { prefix: "D3", cc: "ao" }, // Angola
  { prefix: "D4", cc: "cv" },   // Cap-Vert
  { prefix: "D6", cc: "km" },   // Comores

  // === E ===
  { prefix: "E2", cc: "th" },   // Thaïlande
  { prefix: "E3", cc: "er" },   // Érythrée
  { prefix: "E4", cc: "ps" },   // Palestine
  { prefix: "E5", cc: "ck" },   // Îles Cook
  { prefix: "E6", cc: "ni" },   // Niue (uses NZ flag)
  { prefix: "E7", cc: "ba" },   // Bosnie-Herzégovine
  { prefix: "EA", cc: "es" }, { prefix: "EB", cc: "es" }, { prefix: "EC", cc: "es" },
  { prefix: "ED", cc: "es" }, { prefix: "EE", cc: "es" }, { prefix: "EF", cc: "es" },
  { prefix: "EG", cc: "es" }, { prefix: "EH", cc: "es" }, // Espagne
  { prefix: "EI", cc: "ie" }, { prefix: "EJ", cc: "ie" }, // Irlande
  { prefix: "EK", cc: "am" },   // Arménie
  { prefix: "EL", cc: "lr" },   // Liberia
  { prefix: "EP", cc: "ir" }, { prefix: "EQ", cc: "ir" }, // Iran
  { prefix: "ER", cc: "md" },   // Moldavie
  { prefix: "ES", cc: "ee" },   // Estonie
  { prefix: "ET", cc: "et" },   // Éthiopie
  { prefix: "EU", cc: "by" }, { prefix: "EV", cc: "by" }, { prefix: "EW", cc: "by" }, // Biélorussie
  { prefix: "EX", cc: "kg" },   // Kirghizstan
  { prefix: "EY", cc: "tj" },   // Tadjikistan
  { prefix: "EZ", cc: "tm" },   // Turkménistan

  // === G / UK ===
  { prefix: "GD", cc: "gb" },   // Île de Man
  { prefix: "GI", cc: "gb" },   // Irlande du Nord
  { prefix: "GJ", cc: "gb" },   // Jersey
  { prefix: "GM", cc: "gb" },   // Écosse
  { prefix: "GU", cc: "gb" },   // Guernesey
  { prefix: "GW", cc: "gb" },   // Pays de Galles
  { prefix: "G", cc: "gb" },    // Angleterre

  // === H ===
  { prefix: "HA", cc: "hu" }, { prefix: "HG", cc: "hu" }, // Hongrie
  { prefix: "HB0", cc: "li" },  // Liechtenstein
  { prefix: "HB", cc: "ch" },   // Suisse (fallback)
  { prefix: "HC", cc: "ec" }, { prefix: "HD", cc: "ec" }, // Équateur
  { prefix: "HH", cc: "ht" },   // Haïti
  { prefix: "HI", cc: "do" },   // Rép. dominicaine
  { prefix: "HJ", cc: "co" }, { prefix: "HK", cc: "co" }, // Colombie
  { prefix: "HL", cc: "kr" },   // Corée du Sud
  { prefix: "HP", cc: "pa" },   // Panama
  { prefix: "HQ", cc: "hn" }, { prefix: "HR", cc: "hn" }, // Honduras
  { prefix: "HS", cc: "th" },   // Thaïlande
  { prefix: "HV", cc: "va" },   // Vatican
  { prefix: "HZ", cc: "sa" },   // Arabie saoudite
  { prefix: "H4", cc: "sb" },   // Îles Salomon

  // === I ===
  { prefix: "IT9", cc: "it" },  // Sicile
  { prefix: "IS", cc: "it" },   // Sardaigne
  { prefix: "IW", cc: "it" }, { prefix: "IX", cc: "it" }, { prefix: "IY", cc: "it" }, { prefix: "IZ", cc: "it" },
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

  // === L ===
  { prefix: "LA", cc: "no" }, { prefix: "LB", cc: "no" }, { prefix: "LC", cc: "no" },
  { prefix: "LD", cc: "no" }, { prefix: "LE", cc: "no" }, { prefix: "LF", cc: "no" },
  { prefix: "LG", cc: "no" }, { prefix: "LH", cc: "no" }, { prefix: "LI", cc: "no" },
  { prefix: "LJ", cc: "no" }, { prefix: "LK", cc: "no" }, { prefix: "LL", cc: "no" },
  { prefix: "LM", cc: "no" }, { prefix: "LN", cc: "no" }, // Norvège
  { prefix: "LO", cc: "ar" }, { prefix: "LP", cc: "ar" }, { prefix: "LQ", cc: "ar" },
  { prefix: "LR", cc: "ar" }, { prefix: "LS", cc: "ar" }, { prefix: "LT", cc: "ar" },
  { prefix: "LU", cc: "ar" }, { prefix: "LV", cc: "ar" }, { prefix: "LW", cc: "ar" }, // Argentine
  { prefix: "LX", cc: "lu" },   // Luxembourg
  { prefix: "LY", cc: "lt" },   // Lituanie
  { prefix: "LZ", cc: "bg" },   // Bulgarie

  // === M ===
  { prefix: "M", cc: "gb" },    // UK

  // === O ===
  { prefix: "OE", cc: "at" },   // Autriche
  { prefix: "OF", cc: "fi" }, { prefix: "OG", cc: "fi" }, { prefix: "OH", cc: "fi" }, { prefix: "OI", cc: "fi" }, // Finlande
  { prefix: "OK", cc: "cz" }, { prefix: "OL", cc: "cz" }, // Tchéquie
  { prefix: "OM", cc: "sk" },   // Slovaquie
  { prefix: "ON", cc: "be" }, { prefix: "OO", cc: "be" }, { prefix: "OP", cc: "be" },
  { prefix: "OQ", cc: "be" }, { prefix: "OR", cc: "be" }, { prefix: "OS", cc: "be" }, { prefix: "OT", cc: "be" }, // Belgique
  { prefix: "OU", cc: "dk" },   // Danemark
  { prefix: "OX", cc: "gl" },   // Groenland
  { prefix: "OY", cc: "fo" },   // Îles Féroé
  { prefix: "OZ", cc: "dk" },   // Danemark

  // === P ===
  { prefix: "PA", cc: "nl" }, { prefix: "PB", cc: "nl" }, { prefix: "PC", cc: "nl" },
  { prefix: "PD", cc: "nl" }, { prefix: "PE", cc: "nl" }, { prefix: "PF", cc: "nl" },
  { prefix: "PG", cc: "nl" }, { prefix: "PH", cc: "nl" }, { prefix: "PI", cc: "nl" }, // Pays-Bas
  { prefix: "PJ", cc: "nl" },   // Antilles néerlandaises
  { prefix: "PP", cc: "br" }, { prefix: "PQ", cc: "br" }, { prefix: "PR", cc: "br" },
  { prefix: "PS", cc: "br" }, { prefix: "PT", cc: "br" }, { prefix: "PU", cc: "br" },
  { prefix: "PV", cc: "br" }, { prefix: "PW", cc: "br" }, { prefix: "PX", cc: "br" },
  { prefix: "PY", cc: "br" }, // Brésil
  { prefix: "PZ", cc: "sr" },   // Suriname
  { prefix: "P2", cc: "pg" },   // Papouasie-Nouvelle-Guinée
  { prefix: "P4", cc: "aw" },   // Aruba
  { prefix: "P5", cc: "kp" },   // Corée du Nord

  // === R / U = Russie ===
  { prefix: "RA", cc: "ru" }, { prefix: "RC", cc: "ru" }, { prefix: "RD", cc: "ru" },
  { prefix: "RE", cc: "ru" }, { prefix: "RF", cc: "ru" }, { prefix: "RG", cc: "ru" },
  { prefix: "RJ", cc: "ru" }, { prefix: "RK", cc: "ru" }, { prefix: "RL", cc: "ru" },
  { prefix: "RM", cc: "ru" }, { prefix: "RN", cc: "ru" }, { prefix: "RO", cc: "ru" },
  { prefix: "RQ", cc: "ru" }, { prefix: "RR", cc: "ru" }, { prefix: "RS", cc: "ru" },
  { prefix: "RT", cc: "ru" }, { prefix: "RU", cc: "ru" }, { prefix: "RV", cc: "ru" },
  { prefix: "RW", cc: "ru" }, { prefix: "RX", cc: "ru" }, { prefix: "RY", cc: "ru" },
  { prefix: "RZ", cc: "ru" },
  { prefix: "R", cc: "ru" },
  { prefix: "UA", cc: "ru" }, { prefix: "UB", cc: "ru" }, { prefix: "UC", cc: "ru" },
  { prefix: "UD", cc: "ru" }, { prefix: "UE", cc: "ru" }, { prefix: "UF", cc: "ru" },
  { prefix: "UG", cc: "ru" }, { prefix: "UH", cc: "ru" }, { prefix: "UI", cc: "ru" },

  // === S ===
  { prefix: "S2", cc: "bd" }, { prefix: "S3", cc: "bd" }, // Bangladesh
  { prefix: "S5", cc: "si" },   // Slovénie
  { prefix: "S7", cc: "sc" },   // Seychelles
  { prefix: "S9", cc: "st" },   // São Tomé
  { prefix: "SA", cc: "se" }, { prefix: "SB", cc: "se" }, { prefix: "SC", cc: "se" },
  { prefix: "SD", cc: "se" }, { prefix: "SE", cc: "se" }, { prefix: "SF", cc: "se" },
  { prefix: "SG", cc: "se" }, { prefix: "SH", cc: "se" }, { prefix: "SI", cc: "se" },
  { prefix: "SJ", cc: "se" }, { prefix: "SK", cc: "se" }, { prefix: "SL", cc: "se" }, { prefix: "SM", cc: "se" }, // Suède
  { prefix: "SN", cc: "pl" }, { prefix: "SO", cc: "pl" }, { prefix: "SP", cc: "pl" },
  { prefix: "SQ", cc: "pl" }, { prefix: "SR", cc: "pl" }, // Pologne
  { prefix: "ST", cc: "sd" }, { prefix: "SS", cc: "sd" }, // Soudan
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
  { prefix: "T2", cc: "tv" },   // Tuvalu
  { prefix: "T3", cc: "ki" },   // Kiribati
  { prefix: "T5", cc: "so" },   // Somalie
  { prefix: "T7", cc: "sm" },   // Saint-Marin
  { prefix: "T8", cc: "pw" },   // Palaos
  { prefix: "T9", cc: "ba" },   // Bosnie

  // === U = Ukraine, Ouzbékistan, Kazakhstan ===
  { prefix: "UK", cc: "uz" },   // Ouzbékistan
  { prefix: "UJ", cc: "uz" }, { prefix: "UL", cc: "uz" }, { prefix: "UM", cc: "uz" }, // Ouzbékistan
  { prefix: "UN", cc: "kz" }, { prefix: "UP", cc: "kz" }, { prefix: "UQ", cc: "kz" }, // Kazakhstan
  { prefix: "UR", cc: "ua" }, { prefix: "US", cc: "ua" }, { prefix: "UT", cc: "ua" },
  { prefix: "UU", cc: "ua" }, { prefix: "UV", cc: "ua" }, { prefix: "UW", cc: "ua" },
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
  { prefix: "VD", cc: "ca" }, { prefix: "VE", cc: "ca" }, { prefix: "VF", cc: "ca" },
  { prefix: "VG", cc: "ca" }, { prefix: "VO", cc: "ca" }, { prefix: "VX", cc: "ca" }, { prefix: "VY", cc: "ca" }, // Canada
  { prefix: "VK", cc: "au" },   // Australie
  { prefix: "VP2E", cc: "ai" }, // Anguilla
  { prefix: "VP2M", cc: "ms" }, // Montserrat
  { prefix: "VP2V", cc: "vg" }, // Îles Vierges britanniques
  { prefix: "VP5", cc: "tc" },  // Turques-et-Caïques
  { prefix: "VP8", cc: "fk" },  // Falkland
  { prefix: "VP9", cc: "bm" },  // Bermudes
  { prefix: "VQ9", cc: "io" },  // Diego Garcia
  { prefix: "VR", cc: "hk" },   // Hong Kong
  { prefix: "VU", cc: "in" }, { prefix: "VT", cc: "in" }, { prefix: "VV", cc: "in" }, { prefix: "VW", cc: "in" }, // Inde

  // === X ===
  { prefix: "XA", cc: "mx" }, { prefix: "XB", cc: "mx" }, { prefix: "XC", cc: "mx" },
  { prefix: "XD", cc: "mx" }, { prefix: "XE", cc: "mx" }, { prefix: "XF", cc: "mx" }, // Mexique
  { prefix: "XJ", cc: "ca" }, { prefix: "XK", cc: "ca" }, { prefix: "XL", cc: "ca" },
  { prefix: "XM", cc: "ca" }, { prefix: "XN", cc: "ca" }, { prefix: "XO", cc: "ca" }, // Canada
  { prefix: "XP", cc: "dk" },   // Danemark (Groenland)
  { prefix: "XR", cc: "cl" },   // Chili
  { prefix: "XS", cc: "cn" },   // Chine
  { prefix: "XT", cc: "bf" },   // Burkina Faso
  { prefix: "XU", cc: "kh" },   // Cambodge
  { prefix: "XV", cc: "vn" }, { prefix: "XX", cc: "vn" }, // Vietnam (historic)
  { prefix: "XW", cc: "la" },   // Laos
  { prefix: "XY", cc: "mm" }, { prefix: "XZ", cc: "mm" }, // Myanmar

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
  { prefix: "YV", cc: "ve" }, { prefix: "YW", cc: "ve" }, { prefix: "YX", cc: "ve" }, { prefix: "YY", cc: "ve" }, // Venezuela

  // === Z ===
  { prefix: "Z2", cc: "zw" },   // Zimbabwe
  { prefix: "Z3", cc: "mk" },   // Macédoine du Nord
  { prefix: "Z6", cc: "xk" },   // Kosovo
  { prefix: "Z8", cc: "ss" },   // Soudan du Sud
  { prefix: "ZA", cc: "al" },   // Albanie
  { prefix: "ZB", cc: "gi" },   // Gibraltar
  { prefix: "ZC4", cc: "gb" },  // UK Souverain à Chypre
  { prefix: "ZD7", cc: "sh" },  // Sainte-Hélène
  { prefix: "ZD8", cc: "ac" },  // Ascension
  { prefix: "ZD9", cc: "sh" },  // Tristan da Cunha
  { prefix: "ZF", cc: "ky" },   // Îles Caïmans
  { prefix: "ZK", cc: "nz" }, { prefix: "ZL", cc: "nz" }, { prefix: "ZM", cc: "nz" }, // Nouvelle-Zélande
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
    cn: "Chine", tw: "Taïwan", li: "Liechtenstein", ht: "Haïti",
    so: "Somalie", er: "Érythrée", ps: "Palestine", tj: "Tadjikistan",
    tm: "Turkménistan", kp: "Corée du Nord", pg: "Papouasie-N-G",
    aw: "Aruba", io: "Diego Garcia", tv: "Tuvalu", ki: "Kiribati",
    un: "ONU",
  };
  const cc = getCountryCode(callsign);
  return cc ? COUNTRY_NAMES[cc] || cc.toUpperCase() : null;
}
