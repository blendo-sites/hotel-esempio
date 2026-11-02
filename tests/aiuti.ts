// Test helpers: a throwaway copy of the site files the checks read.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse, stringify } from "yaml";

export const RADICE = join(import.meta.dirname, "..");

export function copiaSito(): string {
  const cartella = mkdtempSync(join(tmpdir(), "sito-"));
  for (const voce of ["blendo.yml", "schema.json", "content", "src/assets/foto"]) {
    cpSync(join(RADICE, voce), join(cartella, voce), { recursive: true });
  }
  return cartella;
}

export function leggiJson(cartella: string, file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(cartella, file), "utf8"));
}

export function scriviJson(cartella: string, file: string, dati: unknown): void {
  writeFileSync(join(cartella, file), JSON.stringify(dati, null, 2));
}

export function modificaBlendoYml(cartella: string, modifica: (config: any) => void): void {
  const file = join(cartella, "blendo.yml");
  const config = parse(readFileSync(file, "utf8"));
  modifica(config);
  writeFileSync(file, stringify(config));
}
