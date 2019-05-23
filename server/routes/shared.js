import { wire } from 'hypermorphic';
import Home from '../../shared/components/Home.js';
import Shared from '../../shared/components/Shared.js';
import view from '../../shared/views/default.js';
import { query } from '../db/index.js';

export default async function shared(req, res) {
  const id = req.params.id;

  if (!id) {
    res.sendStatus(422);
    res.write(
      view(wire(), {
        main: new Home(),
        url: res.locals.url,
        title: req.app.locals.title,
        assetPath: res.app.locals.assetPath,
        description: req.app.locals.description,
      })
    );
    res.end();
    return;
  }

  try {
    const result = await query('SELECT COUNT(*) FROM slices WHERE id LIKE $1', [
      `${id}%`,
    ]);
    const row = result.rows[0];
    const count = Number.parseInt(row.count);
    if (!count) {
      res.writeHead(404, {
        'Content-Type': 'text/html',
      });
      res.write(
        view(wire(), {
          main: new Home(),
          url: res.locals.url,
          title: req.app.locals.title,
          assetPath: res.app.locals.assetPath,
          description: req.app.locals.description,
        })
      );
      res.end();
      return;
    } else if (count > 1) {
      res.writeHead(409, {
        'Content-Type': 'text/html',
      });
      res.write(
        view(wire(), {
          main: new Home(),
          url: res.locals.url,
          title: req.app.locals.title,
          assetPath: res.app.locals.assetPath,
          description: req.app.locals.description,
        })
      );
      res.end();
      return;
    }
  } catch (err) {
    console.error(err);
    res.writeHead(500, {
      'Content-Type': 'text/html',
    });
    res.write(
      view(wire(), {
        main: new Home(),
        url: res.locals.url,
        title: req.app.locals.title,
        assetPath: res.app.locals.assetPath,
        description: req.app.locals.description,
      })
    );
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  res.write(
    view(wire(), {
      main: new Shared(),
      url: res.locals.url,
      title: req.app.locals.title,
      assetPath: res.app.locals.assetPath,
      description: req.app.locals.description,
    })
  );
  res.end();
}
