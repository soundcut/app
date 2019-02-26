import hyperApp from 'hyperhtml-app';

import Home from '../shared/components/Home';
import Upload from '../shared/components/Upload';
import Link from '../shared/components/Link';
import Shared from '../shared/components/Shared';

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

  app.get('/upload', function() {
    const upload = new Upload();
    render.main(upload);
  });

  app.get('/slice/:id', function shared(ctx) {
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
