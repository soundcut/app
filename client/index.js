/* Copyright (C) 2019  Timothée 'tim' Pillard (AGPL-3.0-only) */

import hyperApp from 'hyperhtml-app';

import Home from '../shared/components/Home';
import Link from '../shared/components/Link';
import Shared from '../shared/components/Shared';
import Saved from '../shared/components/Saved';

const app = hyperApp();

function initialize() {
  const render = require('./render').default();

  app.get('/', function home() {
    const home = new Home();
    render.main(home);
  });

  app.get('/link', function link() {
    const link = new Link();
    render.main(link);
  });

  app.get('/saved/:type/:id', function shared(ctx) {
    const saved = new Saved(ctx.params);
    render.main(saved);
  });

  app.get('/shared/:id', function shared(ctx) {
    const shared = new Shared(ctx.params.id);
    render.main(shared);
  });

  app.navigate(location.pathname + location.search);
}

if (document.readyState !== 'loading') {
  initialize();
} else {
  document.addEventListener('DOMContentLoaded', initialize);
}

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  navigator.serviceWorker.register('/service-worker.js');
}

window.addEventListener('appinstalled', function onAppInstalled() {
  const installBtn = document.getElementById('btn-install');
  if (installBtn) {
    installBtn.parentNode.removeChild(installBtn);
  }
});

window.addEventListener('beforeinstallprompt', function onBeforeInstallPrompt(
  evt
) {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  evt.preventDefault();
  const installBtn = document.getElementById('btn-install');
  installBtn.addEventListener('click', function onInstallBtnClick() {
    installBtn.parentNode.removeChild(installBtn);
    evt.prompt();
  });
  installBtn.style.display = 'block';
});
