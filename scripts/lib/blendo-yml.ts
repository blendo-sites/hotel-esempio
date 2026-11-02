// Format of `blendo.yml`, the site rules read by the gateway.
// Described in `docs/architettura.md` of blendo-gateway.
import { z } from "zod";
import { LINGUE } from "../../src/schemas/comuni.ts";

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "usa solo lettere minuscole, numeri e trattini");
const nome = z.string().regex(/\S/).max(120);
const percorsoFile = z.string().regex(/^[^/].*[^/]$|^\*\*$/, "percorso relativo alla radice del sito");

const sezione = z.strictObject({
  id,
  nome,
  file: percorsoFile,
});

const pagina = z.strictObject({
  id,
  titolo: nome,
  percorso: z.string().regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, "percorso come /camere"),
  sezioni: z.array(sezione).min(1),
});

export const blendoYml = z.strictObject({
  sito: id,
  schema: z.literal("schema.json"),
  lingue: z.array(z.enum(LINGUE)).min(1),
  media: z.strictObject({
    formati: z.array(z.enum(["jpg", "png", "webp", "heic"])).min(1),
    max_mb: z.number().positive().max(50),
    cartella: z.string().regex(/^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/, "cartella relativa alla radice del sito, senza / finale"),
  }),
  livelli: z.strictObject({
    contenuti: z.strictObject({
      modificabile: z.array(percorsoFile).min(1),
    }),
    struttura: z.strictObject({
      modificabile: z.array(percorsoFile).min(1),
      approvazione_extra: z.array(percorsoFile),
      review: z.enum(["obbligatoria", "facoltativa"]),
    }),
  }),
  controlli: z.strictObject({
    peso_pagina_kb: z.int().positive().max(10000),
  }),
  pagine: z.array(pagina).min(1),
});

export type BlendoYml = z.infer<typeof blendoYml>;
