const {
  access,
  constants: { X_OK },
} = require('fs');
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

function isFileExecutable(path) {
  return new Promise((resolve, reject) => {
    access(
      path,
      X_OK,
      err => (err ? console.error(err, path) || reject(err) : resolve())
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

  const cProcess = spawn(youtubeDLPath, [url, ...executableArgs]);

  cProcess.stdout.on('data', data => {
    console.log(`stdout: ${data}`);
  });

  cProcess.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
  });

  cProcess.on('exit', function childProcessExit(code, signal) {
    if (code !== null && code !== 0) {
      const error = new Error('Child process exited with non-zero code.');
      console.error(error, { youtubeDLPath, code });
      throw error;
    }

    if (signal !== null) {
      const error = new Error('Child process exited with signal.');
      console.error(error, { youtubeDLPath, signal });
      throw error;
    }

    console.info('Child process correctly exited.');
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
spawnYouTubeDL('https://www.youtube.com/watch?v=jhgJV0Pg54Y');
