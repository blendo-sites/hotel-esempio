// pa11y-ci brings in Puppeteer, which downloads its own Chrome on install.
// CI runners already have Chrome (PUPPETEER_EXECUTABLE_PATH) and Vercel
// does not need it, so the download only happens on developer machines.
module.exports = {
  skipDownload: Boolean(process.env.CI || process.env.VERCEL),
};
