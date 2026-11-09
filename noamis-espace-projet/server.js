'use strict';
const { createApp, loadConfig } = require('./src/app');
const { seedIfEmpty } = require('./scripts/seed');

const config = loadConfig();
const app = createApp(config);
if (config.demoMode) seedIfEmpty(app.locals.ctx);

app.listen(config.port, () => {
  console.log(`NOAMIS — Espace Projet : ${config.baseUrl}`);
  if (!app.locals.ctx.mailer.configured) {
    console.log('E-mails : SMTP non configuré — les notifications restent visibles dans l’application (voir README).');
  }
});
