const { encode } = require('punycode');
const { spawnYouTubeDL } = require('../../lib');

async function link(req, res) {
  if (!req.body) return res.sendStatus(400);

  const queue = req.app.locals.queue;
  const job = async () => await spawnYouTubeDL(req.body.url, req);

  try {
    const ret = await queue.push(job);
    const headers = {
      'content-disposition': `attachment; filename="${encode(ret.title)}"`,
      'content-type': 'audio/mp3',
    };

    res.writeHead(201, headers);
    res.on('error', function(err) {
      console.error(err);
      ret.fileStream.end();
    });
    ret.fileStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}

module.exports = link;
