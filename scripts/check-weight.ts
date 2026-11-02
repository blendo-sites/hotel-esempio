// Page weight: for every HTML page in `dist/`, the size of the page plus the
// local files it loads (styles, scripts, images, icons) must stay under
// `controlli.peso_pagina_kb` of `blendo.yml`. Files are counted as built,
// without compression, so the limit is on the safe side. Of a `srcset` the
// browser downloads one candidate: the largest is the one counted.
//
// Also checks that every page of the map in `blendo.yml` has been built.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { type Errore, leggiBlendoYml } from "./lib/sito.ts";

export type PesoPagina = { pagina: string; byte: number; risorse: string[] };

// Local resources loaded by the page itself; `<a href>` is a link, not a load.
const TAG = /<(img|script|source|audio|video|iframe|link)\b[^>]*>/g;

function attributo(tag: string, nome: string): string | undefined {
  return new RegExp(`\\s${nome}="([^"]+)"`).exec(tag)?.[1];
}

/** `/a.webp 480w, /b.webp 800w` → `/b.webp`. */
function candidatoMaggiore(srcset: string): string {
  const candidati = srcset.split(",").map((voce) => {
    const [url, descrittore = "1x"] = voce.trim().split(/\s+/);
    return { url, misura: Number.parseFloat(descrittore) };
  });
  return candidati.reduce((a, b) => (b.misura > a.misura ? b : a)).url;
}

function risorseLocali(html: string): string[] {
  const trovate = new Set<string>();
  for (const [tag, nome] of html.matchAll(TAG)) {
    const srcset = attributo(tag, "srcset");
    const valore = srcset ? candidatoMaggiore(srcset) : attributo(tag, nome === "link" ? "href" : "src");
    if (valore?.startsWith("/") && !valore.startsWith("//")) trovate.add(valore.split(/[?#]/)[0]);
  }
  return [...trovate].sort();
}

export function pesaPagine(dist: string): PesoPagina[] {
  return readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".html"))
    .map((d) => {
      const file = join(d.parentPath, d.name);
      const html = readFileSync(file, "utf8");
      const risorse = risorseLocali(html).filter((r) => {
        const p = join(dist, r);
        return existsSync(p) && statSync(p).isFile();
      });
      const byte = statSync(file).size + risorse.reduce((tot, r) => tot + statSync(join(dist, r)).size, 0);
      return { pagina: file.slice(dist.length).split("\\").join("/"), byte, risorse };
    })
    .sort((a, b) => a.pagina.localeCompare(b.pagina));
}

export function checkWeight(radice: string, dist = join(radice, "dist")): { pesi: PesoPagina[]; errori: Errore[] } {
  const { config, errori } = leggiBlendoYml(radice);
  if (!config) return { pesi: [], errori };
  if (!existsSync(dist)) return { pesi: [], errori: [{ file: "dist", messaggio: "manca la build: lancia `npm run build`" }] };

  const limite = config.controlli.peso_pagina_kb * 1024;
  const pesi = pesaPagine(dist);
  for (const p of pesi) {
    if (p.byte > limite) {
      errori.push({
        file: `dist${p.pagina}`,
        messaggio: `pesa ${Math.ceil(p.byte / 1024)} KB, oltre il limite di ${config.controlli.peso_pagina_kb} KB`,
      });
    }
  }
  for (const pagina of config.pagine) {
    const html = join(dist, pagina.percorso, "index.html");
    if (!existsSync(html)) {
      errori.push({ file: "blendo.yml", messaggio: `la pagina «${pagina.id}» (${pagina.percorso}) non è nella build` });
    }
  }
  return { pesi, errori };
}

if (import.meta.main) {
  const radice = join(import.meta.dirname, "..");
  const { pesi, errori } = checkWeight(radice);
  for (const p of pesi) console.log(`${String(Math.ceil(p.byte / 1024)).padStart(6)} KB  ${p.pagina}`);
  if (errori.length > 0) {
    console.error(`Controllo del peso non superato (${errori.length} errori):`);
    for (const e of errori) console.error(`  ${e.file}: ${e.messaggio}`);
    process.exit(1);
  }
  console.log("Peso delle pagine nei limiti.");
}
