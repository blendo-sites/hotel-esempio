# Sito Blendo (starter)

Modello da cui nascono i siti vetrina dei clienti di Blendo. Sito statico [Astro](https://astro.build), contenuti in JSON, regole in `blendo.yml`.

Il cliente non tocca questo repo: chiede le modifiche al suo assistente AI, e il gateway Blendo apre una pull request che cambia solo i file in `content/`. Questo README è per chi sviluppa in Blendo.

## Comandi

Serve Node 24 (vedi `.nvmrc`).

| Comando | Cosa fa |
| --- | --- |
| `npm ci` | installa le dipendenze |
| `npm run dev` | sito in locale su `http://localhost:4321` |
| `npm run build` | rigenera `schema.json`, verifica i tipi (`astro check`) e crea `dist/` |
| `npm run schema` | rigenera solo `schema.json` dagli schemi Zod |
| `npm run check:content` | valida `blendo.yml`, la mappa delle pagine e tutti i file di `content/` |
| `npm run check:a11y` | accessibilità (pa11y-ci, axe, WCAG 2 AA) sulle pagine di `dist/` |
| `npm run check:links` | link interni rotti in `dist/` (gli esterni non sono controllati) |
| `npm run check:weight` | peso di ogni pagina, contro `controlli.peso_pagina_kb` |
| `npm test` | test degli script di controllo |

`check:a11y` usa Chrome: quello in `PUPPETEER_EXECUTABLE_PATH`, altrimenti un Chrome installato nei percorsi abituali (macOS e Linux).

Gli stessi controlli girano in GitHub Actions (`.github/workflows/controlli.yml`) su ogni pull request. Nel ruleset di main è obbligatoria solo la check `controlli-ok`, che passa quando passano tutte le altre.

## Come è fatto

```
blendo.yml              regole del sito e mappa delle pagine (letto dal gateway)
schema.json             JSON Schema dei contenuti, generato: non modificarlo a mano
content/                contenuti, un file JSON per sezione (le camere: un file per camera)
src/schemas/            schemi Zod dei contenuti e elenco delle collezioni
src/content.config.ts   collezioni Astro, costruite dall'elenco di src/schemas/
src/i18n/               lingue, voci di menu, testi fissi
src/pages/[...lingua]/  una pagina per voce della mappa, in tutte le lingue
scripts/                export dello schema e controlli
```

### Lingue

- Le lingue sono in `blendo.yml` (`lingue`). La prima è quella predefinita, senza prefisso nell'indirizzo (`/camere`); le altre hanno il prefisso (`/en/camere`, `/de/camere`).
- I testi per i visitatori sono oggetti `{ "it": "...", "en": "...", "de": "..." }`. L'italiano è obbligatorio; se manca una traduzione si mostra l'italiano, marcato con `lang="it"`.
- Prezzi, orari e numeri si scrivono una volta sola, fuori dagli oggetti di testo.

### Regole degli schemi

`schema.json` è l'unica cosa che il gateway usa per validare le modifiche: non esegue mai codice del sito. Per questo negli schemi Zod:

- si usa `z.strictObject`, così una chiave sconosciuta è un errore;
- solo tipi semplici che arrivano nel JSON Schema: niente `.refine()`, `.transform()`, `.trim()`;
- lo schema è puro: `src/schemas/` importa solo `zod`, perché gli script lo eseguono con Node fuori da Astro.

## Aggiungere una sezione a una pagina

1. Scrivi lo schema in `src/schemas/index.ts` e aggiungi la collezione a `collezioni`, con il percorso del file (o un pattern come `content/camere/*.json`).
2. Aggiungi la stessa collezione in `src/content.config.ts` (il controllo dei tipi segnala se manca).
3. Crea il file in `content/`.
4. Aggiungi la sezione alla pagina in `blendo.yml` (`pagine` → `sezioni`), con un nome comprensibile per il cliente.
5. Usa i dati nella pagina con `getCollection("nome")`.
6. `npm run build && npm run check:content && npm test`, poi committa anche `schema.json`.

## Aggiungere una pagina

1. Crea `src/pages/[...lingua]/<pagina>.astro` sul modello delle altre (`getStaticPaths = percorsiLingue`).
2. Aggiungi la pagina a `PAGINE`, `PERCORSI` e alle voci di menu in `src/i18n/index.ts`.
3. Aggiungi la pagina e le sue sezioni a `blendo.yml`. `check:weight` verifica che ogni pagina della mappa sia nella build.

## Hosting

`vercel.json` limita i deploy automatici a `main` (produzione) e ai branch `blendo/**` (preview delle richieste del gateway). Il sito è statico e non serve un adapter.
