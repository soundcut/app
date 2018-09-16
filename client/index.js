require('document-register-element');
import hyperApp from 'hyperhtml-app';
import { wire } from 'hypermorphic';

import Home from '../shared/components/Home';
import Upload from '../shared/components/Upload';
import About from '../shared/components/About';
import Link from '../shared/components/Link';
import Shared from '../shared/components/Shared';

const app = hyperApp();

function initialize() {
  const render = require('./render').default();

  const title = 'Sound Slice';

  let last;
  app.get('/', function home() {
    document.title = title;
    const home = new Home();
    render.main(home);
  });

  app.get('/link', function link() {
    document.title = `Link external media | ${title}`;
    const link = new Link(document.title);
    render.main(link);
  });

  app.get('/upload', function upload() {
    document.title = `Upload an audio file | ${title}`;
    const upload = new Upload();
    render.main(upload);
  });

  app.get('/slice/:id', function shared(ctx) {
    document.title = `Listen to slice | ${title}`;
    const shared = new Shared(ctx.params.id);
    render.main(shared);
  });

  app.get('/about', function about() {
    document.title = `About | ${title}`;
    const about = About(wire());
    render.main(about);
  });

  app.navigate(location.pathname + location.search);
}

if (document.readyState !== 'loading') {
  initialize();
} else {
  document.addEventListener('DOMContentLoaded', initialize);
}
