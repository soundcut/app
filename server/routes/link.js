import { wire } from 'hypermorphic';
import Link from '../../shared/components/Link/index.js';
import view from '../../shared/views/default.js';

export default function link(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Link(),
      url: res.locals.url,
      title: req.app.locals.title,
      assetPath: res.app.locals.assetPath,
      description: req.app.locals.description,
    })
  );
  res.end();
}
