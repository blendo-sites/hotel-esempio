import assert from "node:assert/strict";
import { test } from "node:test";
import { riferimentiMedia } from "../scripts/lib/media.ts";
import { trovaFoto } from "../src/components/foto.ts";
import { generaSchema } from "../scripts/lib/schema.ts";

const { collezioni } = JSON.parse(generaSchema());
const FILE = { src: "/x.webp", width: 10, height: 10, format: "webp" as const };

test("the camera schema marks the photo field for the gateway", () => {
  const foto = collezioni.camere.schema.properties.foto;
  assert.equal(foto.properties.media["x-blendo"], "media");
  assert.deepEqual(foto.required.sort(), ["alt", "media"]);
  assert.deepEqual(foto.properties.alt.required, ["it"]);
  assert.equal(foto.properties.alt.properties.it.maxLength, 150);
  assert.equal(foto.additionalProperties, false);
});

test("photo codes are found by following the schema", () => {
  const schema = collezioni.camere.schema;
  assert.deepEqual(riferimentiMedia({ foto: { media: "foto-1", alt: { it: "x" } } }, schema), ["foto-1"]);
  assert.deepEqual(riferimentiMedia({ nome: { it: "media" } }, schema), []);
  // Wrong types are the schema's problem, not a crash here.
  assert.deepEqual(riferimentiMedia({ foto: "foto-1" }, schema), []);
  assert.deepEqual(riferimentiMedia({ foto: { media: 3 } }, schema), []);
});

test("photo codes are found inside lists", () => {
  const schema = { properties: { galleria: { items: { properties: { media: { "x-blendo": "media" } } } } } };
  assert.deepEqual(riferimentiMedia({ galleria: [{ media: "a" }, { media: "b" }] }, schema), ["a", "b"]);
});

test("the component finds a photo by its code", () => {
  const moduli = { "/src/assets/foto/foto-1.webp": { default: FILE } };
  assert.equal(trovaFoto(moduli, "foto-1"), FILE);
});

test("a photo without its file stops the build with a clear message", () => {
  assert.throws(() => trovaFoto({}, "foto-2"), /La foto «foto-2» non ha il suo file: manca \/src\/assets\/foto\/foto-2\.webp/);
});
