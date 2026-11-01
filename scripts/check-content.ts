// The most important check: it uses the same files the gateway will read
// (`blendo.yml`, `schema.json`, `content/`) and the same rules.
//
// - `blendo.yml` is valid and its page map points at real files;
// - every file in `content/` belongs to exactly one collection and to the map;
// - every JSON file is valid against its collection in `schema.json`.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { isPattern, matches } from "./lib/glob.ts";
import { type Errore, leggiBlendoYml, leggiSchemaJson } from "./lib/sito.ts";

// ajv-formats is CommonJS: depending on the loader the function is the
// default export or sits under `.default`.
const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default ??
  addFormatsModule) as unknown as (ajv: Ajv2020) => void;

const CARTELLA_CONTENUTI = "content";

function elencaFile(radice: string): string[] {
  const cartella = join(radice, CARTELLA_CONTENUTI);
  if (!existsSync(cartella)) return [];
  return readdirSync(cartella, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && !d.name.startsWith("."))
    .map((d) => join(d.parentPath, d.name).slice(radice.length + 1).split("\\").join("/"))
    .sort();
}

function campo(e: ErrorObject): string {
  const percorso = e.instancePath.split("/").filter(Boolean).join(".");
  return percorso ? `il campo «${percorso}»` : "il file";
}

/** Plain Italian for the validation errors that matter for content files. */
export function messaggio(e: ErrorObject): string {
  const p = e.params as Record<string, unknown>;
  switch (e.keyword) {
    case "required":
      return `manca il campo «${[...e.instancePath.split("/").filter(Boolean), p.missingProperty].join(".")}»`;
    case "additionalProperties":
      return `${campo(e)} contiene una chiave non prevista: «${p.additionalProperty}»`;
    case "type":
      return `${campo(e)} deve essere di tipo ${p.type}`;
    case "minLength":
      return `${campo(e)} deve avere almeno ${p.limit} caratteri`;
    case "maxLength":
      return `${campo(e)} può avere al massimo ${p.limit} caratteri`;
    case "minimum":
      return `${campo(e)} deve essere almeno ${p.limit}`;
    case "maximum":
      return `${campo(e)} può essere al massimo ${p.limit}`;
    case "maxItems":
      return `${campo(e)} può avere al massimo ${p.limit} elementi`;
    case "minItems":
      return `${campo(e)} deve avere almeno ${p.limit} elementi`;
    case "pattern":
    case "format":
      return `${campo(e)} non è nel formato previsto`;
    case "enum":
      return `${campo(e)} deve essere uno di: ${(p.allowedValues as unknown[]).join(", ")}`;
    default:
      return `${campo(e)}: ${e.message}`;
  }
}

export function checkContent(radice: string): Errore[] {
  const { config, errori } = leggiBlendoYml(radice);
  if (!config) return errori;

  const { schema, errori: erroriSchema } = leggiSchemaJson(radice, config.schema);
  if (!schema) return erroriSchema;

  if (config.lingue[0] !== "it") {
    errori.push({ file: "blendo.yml", messaggio: "lingue: la prima lingua deve essere it (l'italiano è obbligatorio)" });
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validatori = new Map<string, ValidateFunction>();
  for (const [nome, { schema: s }] of Object.entries(schema.collezioni)) {
    try {
      validatori.set(nome, ajv.compile(s));
    } catch (e) {
      errori.push({ file: config.schema, messaggio: `collezione ${nome}: ${(e as Error).message}` });
    }
  }
  const collezioni = Object.entries(schema.collezioni).map(([nome, c]) => ({ nome, file: c.file }));

  const file = elencaFile(radice);
  const contenuti = config.livelli.contenuti.modificabile;

  // Collections declared with an exact path must have their file.
  for (const c of collezioni) {
    if (!isPattern(c.file) && !file.includes(c.file)) {
      errori.push({ file: c.file, messaggio: `il file della collezione «${c.nome}» non esiste` });
    }
  }

  // The page map.
  const idPagine = new Set<string>();
  const percorsiPagine = new Set<string>();
  const sezioniMappa: string[] = [];
  for (const pagina of config.pagine) {
    const dove = `pagina «${pagina.id}»`;
    if (idPagine.has(pagina.id)) errori.push({ file: "blendo.yml", messaggio: `${dove}: id ripetuto` });
    if (percorsiPagine.has(pagina.percorso)) {
      errori.push({ file: "blendo.yml", messaggio: `${dove}: percorso ${pagina.percorso} già usato` });
    }
    idPagine.add(pagina.id);
    percorsiPagine.add(pagina.percorso);

    const idSezioni = new Set<string>();
    for (const sezione of pagina.sezioni) {
      const qui = `${dove}, sezione «${sezione.id}»`;
      if (idSezioni.has(sezione.id)) errori.push({ file: "blendo.yml", messaggio: `${qui}: id ripetuto` });
      idSezioni.add(sezione.id);
      sezioniMappa.push(sezione.file);

      if (!contenuti.some((p) => matches(p, sezione.file))) {
        errori.push({ file: "blendo.yml", messaggio: `${qui}: ${sezione.file} non è tra i file modificabili dei contenuti` });
      }
      if (isPattern(sezione.file)) {
        if (!collezioni.some((c) => c.file === sezione.file)) {
          errori.push({ file: "blendo.yml", messaggio: `${qui}: il gruppo ${sezione.file} non corrisponde a nessuna collezione` });
        }
      } else if (!file.includes(sezione.file)) {
        errori.push({ file: "blendo.yml", messaggio: `${qui}: il file ${sezione.file} non esiste` });
      }
    }
  }

  // Every content file: one collection, in the map, valid.
  for (const f of file) {
    const proprie = collezioni.filter((c) => matches(c.file, f));
    if (proprie.length === 0) {
      errori.push({ file: f, messaggio: "non appartiene a nessuna collezione dello schema" });
      continue;
    }
    if (proprie.length > 1) {
      errori.push({ file: f, messaggio: `appartiene a più collezioni: ${proprie.map((c) => c.nome).join(", ")}` });
      continue;
    }
    if (!sezioniMappa.some((s) => s === f || (isPattern(s) && matches(s, f)))) {
      errori.push({ file: f, messaggio: "non compare nella mappa delle pagine di blendo.yml" });
    }
    if (!contenuti.some((p) => matches(p, f))) {
      errori.push({ file: f, messaggio: "non è tra i file modificabili dei contenuti" });
    }

    let dati: unknown;
    try {
      dati = JSON.parse(readFileSync(join(radice, f), "utf8"));
    } catch (e) {
      errori.push({ file: f, messaggio: `JSON non valido: ${(e as Error).message}` });
      continue;
    }
    const valida = validatori.get(proprie[0].nome);
    if (valida && !valida(dati)) {
      for (const e of valida.errors ?? []) errori.push({ file: f, messaggio: messaggio(e) });
    }
  }

  return errori;
}

if (import.meta.main) {
  const radice = join(import.meta.dirname, "..");
  const errori = checkContent(radice);
  if (errori.length > 0) {
    console.error(`Contenuti non validi (${errori.length} errori):`);
    for (const e of errori) console.error(`  ${e.file}: ${e.messaggio}`);
    process.exit(1);
  }
  console.log("Contenuti validi.");
}
