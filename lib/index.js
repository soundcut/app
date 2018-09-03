const {
  access,
  constants: { X_OK, R_OK },
  createReadStream,
  readFile,
} = require('fs');
const { createHash } = require('crypto');
const { parse } = require('url');
const { join } = require('path');
const { spawn } = require('child_process');

const executableArgs = [
  // DOWNLOAD
  '--no-playlist',
  // FILESYSTEM
  '--no-cache-dir',
  '--write-description',
  '--write-info-json',
  '--write-annotations',
  // MISC
  '--no-call-home',
  // AUDIO
  '-x', // --extract-audio
  '--audio-format=mp3',
  '--audio-quality=9',
  '--embed-thumbnail',
  // SUBTITLES
  '--all-subs',
];
// const ffmpegPath = '/srv/data/home/ffmpeg';
const ffmpegPath = '/usr/bin/ffmpeg';
// const youtubeDLPath = '/srv/data/home/youtube-dl';
const youtubeDLPath = '/usr/local/bin/youtube-dl';
const allowedProtocols = ['http:', 'https:'];
const forbiddenHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
const destPath = '/tmp/';

function isFileExecutable(path) {
  return new Promise((resolve, reject) => {
    access(
      path,
      X_OK,
      err => (err ? console.error(err, path) || reject(err) : resolve())
    );
  });
}

function isFileReadable(path) {
  return new Promise((resolve, reject) => {
    access(
      path,
      R_OK,
      err => (err ? console.error(err, path) || resolve(false) : resolve(true))
    );
  });
}

function isValidURL(url) {
  try {
    const parsed = parse(url + '');
    return (
      !!parsed.hostname &&
      allowedProtocols.indexOf(parsed.protocol) > -1 &&
      forbiddenHosts.indexOf(parsed.hostname) < 0
    );
  } catch (err) {
    console.error(err, { url });
    return false;
  }
}

function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    readFile(
      path,
      (err, data) => (err ? console.error(err, path) || reject(err) : resolve(data))
    );
  });
}

async function spawnYouTubeDL(url, options) {
  if (!isValidURL(url)) throw new Error('Provided URL is invalid.');
  try {
    await Promise.all([
      isFileExecutable(youtubeDLPath),
      isFileExecutable(ffmpegPath),
    ]);
  } catch (err) {
    throw new Error('Cannot execute download utility.');
  }

  const output = createHash('sha256').update(url, 'utf8').digest('hex');

  return new Promise((resolve, reject) => {
    const cProcess = spawn(
      youtubeDLPath,
      [url, `--output=${join(destPath, output)}.%(ext)s`, ...executableArgs],
    );

    cProcess.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
    });

    cProcess.stderr.on('data', data => {
      console.error(`stderr: ${data}`);
    });

    cProcess.on('exit', async function childProcessExit(code, signal) {
      if (code !== null && code !== 0) {
        const error = new Error('Child process exited with non-zero code.');
        console.error(error, { youtubeDLPath, code });
        reject(error);
      }

      if (signal !== null) {
        const error = new Error('Child process exited with signal.');
        console.error(error, { youtubeDLPath, signal });
        reject(error);
      }

      console.info('Child process correctly exited.');
      console.info('Retrieving mp3 file stream...');
      const readOK = await isFileReadable(join(destPath, `${output}.mp3`));
      if (readOK) {
        let title = 'Untitled file';
        const fileStream = createReadStream(join(destPath, `${output}.mp3`));
        try {
          title = JSON.parse(await readFileAsync(join(destPath, `${output}.info.json`))).title;
        } finally {
          const ret = {
            title: JSON.stringify(title),
            fileStream,
          };
          resolve(ret);
        }
      }
    });
  });
}

// spawnYouTubeDL(null);
// spawnYouTubeDL(undefined);
// spawnYouTubeDL('');
// spawnYouTubeDL('{}');
// spawnYouTubeDL({ });
// spawnYouTubeDL(new Buffer([]));
// spawnYouTubeDL('foo.bar');
// spawnYouTubeDL('foo.bar.baz');
// spawnYouTubeDL('https://www.youtube.com/watch?v=jhgJV0Pg54Y');

module.exports = {
  spawnYouTubeDL,
};
