// Writes `schema.json`: the JSON Schema of every content collection, used by
// `check-content` and by the gateway to validate changes without running code.
import { writeFileSync } from "node:fs";
import { generaSchema } from "./lib/schema.ts";

const destinazione = new URL("../schema.json", import.meta.url);
writeFileSync(destinazione, generaSchema());
console.log("schema.json aggiornato");
