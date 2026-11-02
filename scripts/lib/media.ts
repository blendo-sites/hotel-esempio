// Photo fields of a content file: the ones marked `x-blendo: media` in the schema.
// Same logic as `media_refs` in the gateway (gateway/core/validation.py).

type NodoSchema = {
  "x-blendo"?: string;
  properties?: Record<string, NodoSchema>;
  items?: NodoSchema;
};

/** The photo codes used by a document, in the order they appear. */
export function riferimentiMedia(dati: unknown, schema: NodoSchema): string[] {
  if (schema["x-blendo"] === "media") return typeof dati === "string" ? [dati] : [];
  if (Array.isArray(dati)) {
    const voci = schema.items;
    return voci ? dati.flatMap((d) => riferimentiMedia(d, voci)) : [];
  }
  if (dati && typeof dati === "object") {
    return Object.entries(schema.properties ?? {}).flatMap(([nome, s]) =>
      riferimentiMedia((dati as Record<string, unknown>)[nome], s),
    );
  }
  return [];
}
