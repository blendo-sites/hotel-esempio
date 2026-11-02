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

// The same cases run against the gateway's Python port (tests/test_glob.py).
const casiGlob = JSON.parse(readFileSync(join(RADICE, "tests/glob-cases.json"), "utf8")) as {
  pattern: string;
  path: string;
  match: boolean;
}[];

test("glob: * stays within a folder, ** crosses folders", () => {
  for (const c of casiGlob) {
    assert.equal(matches(c.pattern, c.path), c.match, `${c.pattern} ~ ${c.path}`);
  }
});
