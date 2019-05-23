import { wire } from 'hypermorphic';
import Saved from '../../shared/components/Saved.js';
import view from '../../shared/views/default.js';

export default function saved(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Saved(req.params),
      url: res.locals.url,
      title: req.app.locals.title,
      assetPath: res.app.locals.assetPath,
      description: req.app.locals.description,
    })
  );
  res.end();
}
