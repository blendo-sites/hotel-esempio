// Reading the two files the gateway relies on: `blendo.yml` and `schema.json`.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { type BlendoYml, blendoYml } from "./blendo-yml.ts";

z.config(z.locales.it());

export type Errore = { file: string; messaggio: string };

export type SchemaJson = {
  versione: number;
  collezioni: Record<string, { file: string; schema: object }>;
};

export function leggiBlendoYml(radice: string): { config?: BlendoYml; errori: Errore[] } {
  const file = "blendo.yml";
  const percorso = join(radice, file);
  if (!existsSync(percorso)) return { errori: [{ file, messaggio: "il file non esiste" }] };
  let dati: unknown;
  try {
    dati = parse(readFileSync(percorso, "utf8"));
  } catch (e) {
    return { errori: [{ file, messaggio: `YAML non valido: ${(e as Error).message}` }] };
  }
  const esito = blendoYml.safeParse(dati);
  if (!esito.success) {
    return {
      errori: esito.error.issues.map((i) => ({
        file,
        messaggio: `${i.path.join(".") || "(radice)"}: ${i.message}`,
      })),
    };
  }
  return { config: esito.data, errori: [] };
}

export function leggiSchemaJson(radice: string, file: string): { schema?: SchemaJson; errori: Errore[] } {
  const percorso = join(radice, file);
  if (!existsSync(percorso)) {
    return { errori: [{ file, messaggio: "il file non esiste: generalo con `npm run schema`" }] };
  }
  try {
    const schema = JSON.parse(readFileSync(percorso, "utf8")) as SchemaJson;
    if (schema.versione !== 1 || typeof schema.collezioni !== "object") {
      return { errori: [{ file, messaggio: "formato non riconosciuto (attesa versione 1)" }] };
    }
    return { schema, errori: [] };
  } catch (e) {
    return { errori: [{ file, messaggio: `JSON non valido: ${(e as Error).message}` }] };
  }
}
