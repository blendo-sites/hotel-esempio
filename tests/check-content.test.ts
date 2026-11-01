import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { checkContent } from "../scripts/check-content.ts";
import { copiaSito, leggiJson, modificaBlendoYml, scriviJson } from "./aiuti.ts";

describe("check-content", () => {
  let sito: string;

  beforeEach(() => {
    sito = copiaSito();
  });

  afterEach(() => {
    rmSync(sito, { recursive: true, force: true });
  });

  const messaggi = () => checkContent(sito).map((e) => `${e.file}: ${e.messaggio}`);

  test("the starter content is valid", () => {
    assert.deepEqual(messaggi(), []);
  });

  test("rejects an unknown key", () => {
    const camera = leggiJson(sito, "content/camere/family.json");
    scriviJson(sito, "content/camere/family.json", { ...camera, piscina_privata: true });
    assert.deepEqual(messaggi(), [
      "content/camere/family.json: il file contiene una chiave non prevista: «piscina_privata»",
    ]);
  });

  test("rejects an unknown language inside a text", () => {
    const avviso = leggiJson(sito, "content/home/avviso.json");
    scriviJson(sito, "content/home/avviso.json", { ...avviso, testo: { it: "Ciao", fr: "Salut" } });
    assert.deepEqual(messaggi(), [
      "content/home/avviso.json: il campo «testo» contiene una chiave non prevista: «fr»",
    ]);
  });

  test("rejects a missing field", () => {
    const { prezzo_da: _, ...camera } = leggiJson(sito, "content/camere/family.json");
    scriviJson(sito, "content/camere/family.json", camera);
    assert.deepEqual(messaggi(), ["content/camere/family.json: manca il campo «prezzo_da»"]);
  });

  test("rejects a missing Italian text", () => {
    const avviso = leggiJson(sito, "content/home/avviso.json");
    scriviJson(sito, "content/home/avviso.json", { ...avviso, testo: { en: "Hello" } });
    assert.deepEqual(messaggi(), ["content/home/avviso.json: manca il campo «testo.it»"]);
  });

  test("rejects a wrong type and a wrong format", () => {
    const orari = leggiJson(sito, "content/piscina/orari.json");
    scriviJson(sito, "content/piscina/orari.json", { ...orari, apertura: "9", chiusura: 19 });
    assert.deepEqual(messaggi(), [
      "content/piscina/orari.json: il campo «apertura» non è nel formato previsto",
      "content/piscina/orari.json: il campo «chiusura» deve essere di tipo string",
    ]);
  });

  test("rejects invalid JSON", () => {
    writeFileSync(join(sito, "content/home/avviso.json"), "{ attivo: true");
    const [errore] = messaggi();
    assert.match(errore, /^content\/home\/avviso\.json: JSON non valido/);
  });

  test("rejects a file outside every collection", () => {
    scriviJson(sito, "content/home/extra.json", { testo: "ciao" });
    assert.deepEqual(messaggi(), ["content/home/extra.json: non appartiene a nessuna collezione dello schema"]);
  });

  test("rejects a file outside the page map", () => {
    modificaBlendoYml(sito, (config) => {
      config.pagine = config.pagine.filter((p: { id: string }) => p.id !== "camere");
    });
    assert.deepEqual(messaggi(), [
      "content/camere/doppia-vista-lago.json: non compare nella mappa delle pagine di blendo.yml",
      "content/camere/family.json: non compare nella mappa delle pagine di blendo.yml",
    ]);
  });

  test("rejects a map entry whose file does not exist", () => {
    modificaBlendoYml(sito, (config) => {
      config.pagine[0].sezioni[0].file = "content/home/benvenutu.json";
    });
    assert.deepEqual(messaggi(), [
      "blendo.yml: pagina «home», sezione «benvenuto»: il file content/home/benvenutu.json non esiste",
      "content/home/benvenuto.json: non compare nella mappa delle pagine di blendo.yml",
    ]);
  });

  test("rejects a missing collection file", () => {
    rmSync(join(sito, "content/piscina/orari.json"));
    assert.deepEqual(messaggi(), [
      "content/piscina/orari.json: il file della collezione «piscina_orari» non esiste",
      "blendo.yml: pagina «piscina», sezione «orari-piscina»: il file content/piscina/orari.json non esiste",
    ]);
  });

  test("rejects a map entry outside the editable content", () => {
    modificaBlendoYml(sito, (config) => {
      config.pagine[0].sezioni[0].file = "src/pages/index.astro";
    });
    const errori = messaggi();
    assert.ok(errori.includes("blendo.yml: pagina «home», sezione «benvenuto»: src/pages/index.astro non è tra i file modificabili dei contenuti"));
  });

  test("rejects an invalid blendo.yml", () => {
    modificaBlendoYml(sito, (config) => {
      config.controlli.peso_pagina_kb = "tanto";
      config.extra = 1;
    });
    const errori = messaggi();
    assert.equal(errori.length, 2);
    assert.ok(errori.every((e) => e.startsWith("blendo.yml: ")));
    assert.ok(errori.some((e) => e.includes("controlli.peso_pagina_kb")));
  });
});
