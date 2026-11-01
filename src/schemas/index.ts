// The content collections of the site: the single source used by
// `src/content.config.ts` (to build the pages) and by
// `scripts/export-schema.ts` (to write `schema.json` for the gateway).
//
// This module must import nothing but `zod` and relative modules, because
// the scripts run it directly with Node, outside of Astro.
import { z } from "zod";
import { foto, ora, prezzo, riga, testo } from "./comuni.ts";

const sito = z.strictObject({
  nome: riga.max(80).meta({ description: "Nome della struttura." }),
  sottotitolo: testo(120),
  telefono: z
    .string()
    .regex(/^\+?[0-9 ]{6,20}$/)
    .meta({ description: "Numero di telefono, per esempio +39 045 000 0000." }),
  email: z.email().meta({ description: "Indirizzo email per i contatti." }),
  indirizzo: riga.max(160).meta({ description: "Indirizzo completo." }),
});

const benvenuto = z.strictObject({
  titolo: testo(80),
  testo: testo(600),
  foto: foto.optional(),
});

const avviso = z.strictObject({
  attivo: z.boolean().meta({ description: "Se vero, l'avviso compare in cima alla home." }),
  testo: testo(200),
});

const camera = z.strictObject({
  nome: testo(60),
  descrizione: testo(600),
  metri_quadri: z.int().min(5).max(500).meta({ description: "Superficie in metri quadri." }),
  ospiti: z.int().min(1).max(12).meta({ description: "Numero massimo di ospiti." }),
  prezzo_da: prezzo.meta({ description: "Prezzo a notte a partire da, in euro." }),
  servizi: z.array(testo(60)).max(12),
  foto: foto.optional(),
  ordine: z.int().min(0).max(999).meta({ description: "Posizione nell'elenco: prima i numeri bassi." }),
});

const piatto = testo(120);

const menuDelGiorno = z.strictObject({
  primo: piatto,
  secondo: piatto,
  dolce: piatto,
  prezzo: prezzo.meta({ description: "Prezzo del menù completo, in euro." }),
});

const fascia = z.strictObject({ apertura: ora, chiusura: ora });

const orariRistorante = z.strictObject({
  pranzo: fascia.optional(),
  cena: fascia.optional(),
  chiusura_settimanale: testo(80).optional(),
});

const presentazione = z.strictObject({
  titolo: testo(80),
  testo: testo(800),
});

const orariPiscina = z.strictObject({
  apertura: ora,
  chiusura: ora,
  stagione: testo(120),
});

const comeArrivare = z.strictObject({
  testo: testo(800),
});

export type Collezione = {
  /** Files of the collection, relative to the site root (exact path or glob). */
  file: string;
  schema: z.ZodType;
};

export const collezioni = {
  sito: { file: "content/sito.json", schema: sito },
  home_benvenuto: { file: "content/home/benvenuto.json", schema: benvenuto },
  home_avviso: { file: "content/home/avviso.json", schema: avviso },
  camere: { file: "content/camere/*.json", schema: camera },
  ristorante_presentazione: { file: "content/ristorante/presentazione.json", schema: presentazione },
  ristorante_menu: { file: "content/ristorante/menu-del-giorno.json", schema: menuDelGiorno },
  ristorante_orari: { file: "content/ristorante/orari.json", schema: orariRistorante },
  piscina_presentazione: { file: "content/piscina/presentazione.json", schema: presentazione },
  piscina_orari: { file: "content/piscina/orari.json", schema: orariPiscina },
  contatti_come_arrivare: { file: "content/contatti/come-arrivare.json", schema: comeArrivare },
} satisfies Record<string, Collezione>;

export type NomeCollezione = keyof typeof collezioni;
