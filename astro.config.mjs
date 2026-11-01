// @ts-check
import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import { parse } from "yaml";

// Languages come from `blendo.yml`, the same file the gateway reads, so the
// list is written once. The first language is the default one, served
// without a prefix (`/camere`); the others under `/en/`, `/de/`.
const { lingue } = parse(readFileSync(new URL("./blendo.yml", import.meta.url), "utf8"));

export default defineConfig({
  site: process.env.SITE_URL ?? "https://hotel-esempio.blendo.site",
  trailingSlash: "ignore",
  i18n: {
    locales: lingue,
    defaultLocale: lingue[0],
    routing: { prefixDefaultLocale: false },
  },
});
