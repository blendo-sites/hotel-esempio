// Building blocks shared by the content schemas.
//
// Only plain Zod types that survive `z.toJSONSchema()`: no refine, no
// transform. The gateway validates content with the exported JSON Schema,
// so anything that does not end up there would not be enforced.
import { z } from "zod";

// Fixed list for now: the schema must not depend on `blendo.yml`, because
// `schema.json` is generated without reading the site configuration.
export const LINGUE = ["it", "en", "de"] as const;
export type Lingua = (typeof LINGUE)[number];

// Not `.trim()`: it is a transform, so it would not reach the JSON Schema.
// A non-blank character is required instead.
export const riga = z.string().regex(/\S/);

/** A text shown to visitors: Italian is required, other languages fall back to it. */
export const testo = (max: number) =>
  z
    .strictObject({
      it: riga.min(1).max(max),
      en: riga.min(1).max(max).optional(),
      de: riga.min(1).max(max).optional(),
    })
    .meta({ description: "Testo in italiano (obbligatorio), inglese e tedesco (facoltativi)." });

export type Testo = z.infer<ReturnType<typeof testo>>;

/** Time of day such as "09:30". */
export const ora = z
  .string()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)
  .meta({ description: "Ora nel formato HH:MM, per esempio 09:30." });

/** Price in euro, without currency symbol. */
export const prezzo = z
  .number()
  .min(0)
  .max(100000)
  .meta({ description: "Prezzo in euro, solo il numero." });

/**
 * A photo: the code of a file in the media folder of `blendo.yml`, and its
 * alternative text. `x-blendo` ends up in the JSON Schema: that is how the
 * gateway and `check-content` recognize photo fields without running code.
 */
export const foto = z.strictObject({
  media: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .meta({ "x-blendo": "media", description: "Codice della foto, da carica_media." }),
  alt: testo(150).meta({ description: "Cosa mostra la foto, per chi non la vede." }),
});

export type Foto = z.infer<typeof foto>;
