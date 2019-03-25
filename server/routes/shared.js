const { wire } = require('hypermorphic');
const Home = require('../../shared/components/Home');
const Shared = require('../../shared/components/Shared');
const view = require('../../shared/views/default');
const { query } = require('../db');

const title = 'Sound Slice';

async function shared(req, res) {
  const id = req.params.id;

  if (!id) {
    res.sendStatus(422);
    res.write(
      view(wire(), {
        path: req.path,
        title: title,
        main: new Home(),
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
          path: req.path,
          title: title,
          main: new Home(),
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
          path: req.path,
          title: title,
          main: new Home(),
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
        path: req.path,
        title: title,
        main: new Home(),
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
      path: req.path,
      title: title,
      main: new Shared(),
    })
  );
  res.end();
}

module.exports = shared;
