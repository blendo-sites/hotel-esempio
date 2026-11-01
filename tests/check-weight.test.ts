import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { checkWeight } from "../scripts/check-weight.ts";
import { copiaSito, modificaBlendoYml } from "./aiuti.ts";

const PERCORSI = ["", "camere", "ristorante", "piscina", "contatti"];

describe("check-weight", () => {
  let sito: string;
  let dist: string;

  beforeEach(() => {
    sito = copiaSito();
    dist = join(sito, "dist");
    for (const p of PERCORSI) {
      mkdirSync(join(dist, p), { recursive: true });
      writeFileSync(join(dist, p, "index.html"), `<html><body><a href="/foto/grande.jpg">foto</a></body></html>`);
    }
    mkdirSync(join(dist, "foto"));
    writeFileSync(join(dist, "foto", "grande.jpg"), Buffer.alloc(300 * 1024));
  });

  afterEach(() => {
    rmSync(sito, { recursive: true, force: true });
  });

  test("light pages pass, and links are not counted as loads", () => {
    assert.deepEqual(checkWeight(sito, dist).errori, []);
  });

  test("rejects a page heavier than the limit", () => {
    modificaBlendoYml(sito, (config) => {
      config.controlli.peso_pagina_kb = 100;
    });
    writeFileSync(
      join(dist, "camere", "index.html"),
      `<html><body><img src="/foto/grande.jpg" alt="Camera"></body></html>`,
    );
    const { errori, pesi } = checkWeight(sito, dist);
    assert.deepEqual(
      errori.map((e) => `${e.file}: ${e.messaggio}`),
      ["dist/camere/index.html: pesa 301 KB, oltre il limite di 100 KB"],
    );
    assert.deepEqual(pesi.find((p) => p.pagina === "/camere/index.html")?.risorse, ["/foto/grande.jpg"]);
  });

  test("counts srcset and stylesheets", () => {
    writeFileSync(join(dist, "stile.css"), "a{}".repeat(100));
    writeFileSync(
      join(dist, "index.html"),
      `<html><head><link rel="stylesheet" href="/stile.css"></head><body><img srcset="/foto/grande.jpg 2x, /foto/manca.jpg 1x" alt=""></body></html>`,
    );
    const home = checkWeight(sito, dist).pesi.find((p) => p.pagina === "/index.html");
    assert.deepEqual(home?.risorse, ["/foto/grande.jpg", "/stile.css"]);
  });

  test("rejects a page of the map that was not built", () => {
    rmSync(join(dist, "piscina"), { recursive: true });
    assert.deepEqual(
      checkWeight(sito, dist).errori.map((e) => e.messaggio),
      ["la pagina «piscina» (/piscina) non è nella build"],
    );
  });
});
