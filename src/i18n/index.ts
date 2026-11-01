// Languages, menu labels and helpers for localized texts.
//
// Menu labels and fixed words are structure (Blendo changes them); what the
// client edits is in `content/`.
import { i18n } from "astro:config/client";
import { getRelativeLocaleUrl } from "astro:i18n";
import type { Lingua, Testo } from "../schemas/comuni.ts";

const configurate = (i18n?.locales ?? ["it"]) as Lingua[];

export const LINGUA_PREDEFINITA: Lingua = configurate[0];
export const LINGUE: Lingua[] = configurate;

export const NOMI_LINGUE: Record<Lingua, string> = {
  it: "Italiano",
  en: "English",
  de: "Deutsch",
};

const parole = {
  home: { it: "Home", en: "Home", de: "Startseite" },
  camere: { it: "Camere", en: "Rooms", de: "Zimmer" },
  ristorante: { it: "Ristorante", en: "Restaurant", de: "Restaurant" },
  piscina: { it: "Piscina", en: "Swimming pool", de: "Schwimmbad" },
  contatti: { it: "Contatti", en: "Contact", de: "Kontakt" },
  menu: { it: "Menu principale", en: "Main menu", de: "Hauptmenü" },
  lingua: { it: "Lingua", en: "Language", de: "Sprache" },
  vai_al_contenuto: { it: "Vai al contenuto", en: "Skip to content", de: "Zum Inhalt springen" },
  da: { it: "da", en: "from", de: "ab" },
  a_notte: { it: "a notte", en: "per night", de: "pro Nacht" },
  ospiti: { it: "ospiti", en: "guests", de: "Gäste" },
  menu_del_giorno: { it: "Menù del giorno", en: "Menu of the day", de: "Tagesmenü" },
  primo: { it: "Primo", en: "First course", de: "Erster Gang" },
  secondo: { it: "Secondo", en: "Main course", de: "Hauptgang" },
  dolce: { it: "Dolce", en: "Dessert", de: "Dessert" },
  prezzo: { it: "Prezzo", en: "Price", de: "Preis" },
  orari: { it: "Orari", en: "Opening hours", de: "Öffnungszeiten" },
  pranzo: { it: "Pranzo", en: "Lunch", de: "Mittagessen" },
  cena: { it: "Cena", en: "Dinner", de: "Abendessen" },
  chiuso: { it: "Chiuso", en: "Closed", de: "Geschlossen" },
  recapiti: { it: "Recapiti", en: "Contact details", de: "Kontaktdaten" },
  telefono: { it: "Telefono", en: "Phone", de: "Telefon" },
  email: { it: "Email", en: "Email", de: "E-Mail" },
  indirizzo: { it: "Indirizzo", en: "Address", de: "Adresse" },
  come_arrivare: { it: "Come arrivare", en: "How to get here", de: "Anreise" },
} satisfies Record<string, Record<Lingua, string>>;

export type Parola = keyof typeof parole;

export const PAGINE = ["home", "camere", "ristorante", "piscina", "contatti"] as const;
export type Pagina = (typeof PAGINE)[number];

const PERCORSI: Record<Pagina, string> = {
  home: "",
  camere: "camere",
  ristorante: "ristorante",
  piscina: "piscina",
  contatti: "contatti",
};

export function parola(chiave: Parola, lingua: Lingua): string {
  return parole[chiave][lingua];
}

/** Text in the requested language, or in Italian when it is missing. */
export function traduci(t: Testo, lingua: Lingua): { testo: string; lingua: Lingua } {
  const tradotto = t[lingua];
  return tradotto ? { testo: tradotto, lingua } : { testo: t.it, lingua: "it" };
}

export function url(pagina: Pagina, lingua: Lingua): string {
  return getRelativeLocaleUrl(lingua, PERCORSI[pagina]);
}

/** `getStaticPaths` for a page served in every language: `/camere`, `/en/camere`, ... */
export function percorsiLingue() {
  return LINGUE.map((lingua) => ({
    params: { lingua: lingua === LINGUA_PREDEFINITA ? undefined : lingua },
    props: { lingua },
  }));
}

export function prezzoInEuro(valore: number, lingua: Lingua): string {
  return new Intl.NumberFormat(lingua, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(valore) ? 0 : 2,
  }).format(valore);
}

export type { Lingua };
