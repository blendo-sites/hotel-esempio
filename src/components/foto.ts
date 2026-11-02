// Finding the file of a photo. Apart from the component so the tests can run it.
import type { ImageMetadata } from "astro";

export const CARTELLA_FOTO = "/src/assets/foto";

export type ModuliFoto = Record<string, { default: ImageMetadata }>;

/** The file of the photo with this code; without it the build must fail. */
export function trovaFoto(moduli: ModuliFoto, codice: string): ImageMetadata {
  const modulo = moduli[`${CARTELLA_FOTO}/${codice}.webp`];
  if (!modulo) {
    throw new Error(`La foto «${codice}» non ha il suo file: manca ${CARTELLA_FOTO}/${codice}.webp`);
  }
  return modulo.default;
}
