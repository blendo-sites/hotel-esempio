// Astro collections built from the shared list in `src/schemas/index.ts`.
// Content lives in `content/` at the repo root, outside of `src/`, because
// it is the part that the gateway reads and changes.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import type { z } from "zod";
import { collezioni, type NomeCollezione } from "./schemas/index.ts";

function collezione<S extends z.ZodType>({ file, schema }: { file: string; schema: S }) {
  const slash = file.lastIndexOf("/");
  return defineCollection({
    loader: glob({ base: file.slice(0, slash), pattern: file.slice(slash + 1) }),
    schema,
  });
}

// Listed by name so each collection keeps its own data type; `satisfies`
// makes the type check fail if a collection of `collezioni` is missing here.
export const collections = {
  sito: collezione(collezioni.sito),
  home_benvenuto: collezione(collezioni.home_benvenuto),
  home_avviso: collezione(collezioni.home_avviso),
  camere: collezione(collezioni.camere),
  ristorante_presentazione: collezione(collezioni.ristorante_presentazione),
  ristorante_menu: collezione(collezioni.ristorante_menu),
  ristorante_orari: collezione(collezioni.ristorante_orari),
  piscina_presentazione: collezione(collezioni.piscina_presentazione),
  piscina_orari: collezione(collezioni.piscina_orari),
  contatti_come_arrivare: collezione(collezioni.contatti_come_arrivare),
} satisfies Record<NomeCollezione, unknown>;
