import { wire } from 'hypermorphic';
import Home from '../../shared/components/Home.js';
import view from '../../shared/views/default.js';

export default function home(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Home(),
      url: res.locals.url,
      assetPath: res.app.locals.assetPath,
      title: `${req.app.locals.title} | Extract sound memes in the browser`,
      description: req.app.locals.description,
    })
  );
  res.end();
}
