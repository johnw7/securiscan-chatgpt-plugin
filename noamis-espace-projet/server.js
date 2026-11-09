'use strict';
const { spawn } = require('node:child_process');
const { createApp, loadConfig } = require('./src/app');
const { seedIfEmpty } = require('./scripts/seed');

const config = loadConfig();
const app = createApp(config);
if (config.demoMode) seedIfEmpty(app.locals.ctx);

// Ouverture automatique du navigateur (lanceurs « double-clic » : OPEN_BROWSER=1).
function openBrowser(url) {
  if (process.env.OPEN_BROWSER !== '1') return;
  const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]]
    : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true, windowsVerbatimArguments: process.platform === 'win32' });
    child.on('error', () => {});
    child.unref();
  } catch { /* navigateur à ouvrir manuellement */ }
}

const server = app.listen(config.port, () => {
  const url = `http://localhost:${config.port}`;
  console.log(`NOAMIS — Espace Projet : ${config.baseUrl}`);
  if (!app.locals.ctx.mailer.configured) {
    console.log('E-mails : SMTP non configuré — les notifications restent visibles dans l’application (voir README).');
  }
  if (process.env.OPEN_BROWSER === '1') {
    console.log(`\nL’application est ouverte dans votre navigateur (${url}).`);
    console.log('Laissez cette fenêtre ouverte pendant votre travail. Pour arrêter : fermez-la ou appuyez sur Ctrl+C.\n');
  }
  openBrowser(url);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`L’application semble déjà lancée : ouverture de http://localhost:${config.port}`);
    openBrowser(`http://localhost:${config.port}`);
    setTimeout(() => process.exit(0), 1500);
    return;
  }
  throw err;
});
