// Builds the content of `schema.json` from the shared collection list.
import { z } from "zod";
import { collezioni } from "../../src/schemas/index.ts";

export const VERSIONE_SCHEMA = 1;

/** Recursively sort object keys, so the output does not depend on declaration order. */
export function ordina(valore: unknown): unknown {
  if (Array.isArray(valore)) return valore.map(ordina);
  if (valore && typeof valore === "object") {
    return Object.fromEntries(
      Object.keys(valore)
        .sort()
        .map((k) => [k, ordina((valore as Record<string, unknown>)[k])]),
    );
  }
  return valore;
}

export function generaSchema(): string {
  const documento = {
    versione: VERSIONE_SCHEMA,
    collezioni: Object.fromEntries(
      Object.entries(collezioni).map(([nome, { file, schema }]) => [
        nome,
        {
          file,
          // `io: "input"` describes what may be written in the files
          // (optional fields stay optional even when they have a default).
          schema: z.toJSONSchema(schema, { io: "input", target: "draft-2020-12" }),
        },
      ]),
    ),
  };
  return `${JSON.stringify(ordina(documento), null, 2)}\n`;
}
