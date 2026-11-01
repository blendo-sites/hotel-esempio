import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { generaSchema } from "../scripts/lib/schema.ts";
import { matches } from "../scripts/lib/glob.ts";
import { RADICE } from "./aiuti.ts";

test("schema.json is up to date with the Zod schemas", () => {
  assert.equal(readFileSync(join(RADICE, "schema.json"), "utf8"), generaSchema());
});

test("schema.json rejects unknown keys in every collection", () => {
  const { collezioni } = JSON.parse(generaSchema());
  for (const [nome, { schema }] of Object.entries<{ schema: { additionalProperties: unknown } }>(collezioni)) {
    assert.equal(schema.additionalProperties, false, nome);
  }
});

test("glob: * stays within a folder, ** crosses folders", () => {
  assert.ok(matches("content/camere/*.json", "content/camere/family.json"));
  assert.ok(!matches("content/camere/*.json", "content/camere/sub/family.json"));
  assert.ok(!matches("content/camere/*.json", "content/camere.json"));
  assert.ok(matches("content/**/*.json", "content/sito.json"));
  assert.ok(matches("content/**/*.json", "content/a/b/c.json"));
  assert.ok(!matches("content/**/*.json", "contentx/a.json"));
  assert.ok(matches(".github/**", ".github/workflows/controlli.yml"));
  assert.ok(matches("**", "src/pages/index.astro"));
  assert.ok(!matches("content/*.json", "content/sito.jsonx"));
});
