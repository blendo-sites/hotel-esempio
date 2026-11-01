// Accessibility: serves `dist/` with `astro preview` and runs pa11y-ci
// (axe runner, WCAG 2 AA) on every built page.
//
// Chrome: the path in PUPPETEER_EXECUTABLE_PATH, otherwise a Chrome installed
// in the usual places, otherwise the one downloaded by Puppeteer.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const radice = join(import.meta.dirname, "..");
const dist = join(radice, "dist");
const PORTA = Number(process.env.PORTA_PREVIEW ?? 4329);
const base = `http://localhost:${PORTA}`;

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
];

function chrome(): string | undefined {
  return process.env.PUPPETEER_EXECUTABLE_PATH ?? CHROME.find((p) => existsSync(p));
}

function pagine(): string[] {
  return readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name === "index.html")
    .map((d) => `${base}${d.parentPath.slice(dist.length).split("\\").join("/")}/`)
    .sort();
}

async function attendi(url: string, secondi = 30): Promise<void> {
  for (let i = 0; i < secondi * 4; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`il server di preview non risponde su ${url}`);
}

function esegui(comando: string, argomenti: string[]): Promise<number> {
  return new Promise((resolve) => {
    const p = spawn(comando, argomenti, { cwd: radice, stdio: "inherit" });
    p.on("exit", (code) => resolve(code ?? 1));
  });
}

if (!existsSync(dist)) {
  console.error("Manca la build: lancia `npm run build`.");
  process.exit(1);
}

const preview = spawn("npx", ["astro", "preview", "--port", String(PORTA), "--host", "localhost"], {
  cwd: radice,
  stdio: ["ignore", "ignore", "inherit"],
});
const cartella = mkdtempSync(join(tmpdir(), "pa11y-"));
let codice = 1;
try {
  await attendi(`${base}/`);
  const config = {
    defaults: {
      runners: ["axe"],
      standard: "WCAG2AA",
      timeout: 30000,
      chromeLaunchConfig: {
        executablePath: chrome(),
        // CI runners (Ubuntu 24.04) block the Chrome sandbox; the pages are
        // our own static build, so running without it is acceptable there.
        args: process.env.CI ? ["--no-sandbox"] : [],
      },
    },
    urls: pagine(),
  };
  const file = join(cartella, "pa11y-ci.json");
  writeFileSync(file, JSON.stringify(config, null, 2));
  codice = await esegui("npx", ["pa11y-ci", "--config", file]);
} catch (e) {
  console.error((e as Error).message);
} finally {
  preview.kill();
  rmSync(cartella, { recursive: true, force: true });
}
process.exit(codice);
