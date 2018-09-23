/* eslint-disable no-console */

const {
  access,
  constants: { X_OK, R_OK },
  createReadStream,
  readFile,
  unlink,
} = require('fs');
const { createHash } = require('crypto');
const { parse } = require('url');
const { join } = require('path');
const { spawn } = require('child_process');
const glob = require('glob');

const env = process.env.NODE_ENV || 'development';

const ffmpegPath =
  env === 'development' ? '/usr/bin/ffmpeg' : '/home/hosting-user/ffmpeg';
const youtubeDLPath =
  env === 'development'
    ? '/usr/local/bin/youtube-dl'
    : '/home/hosting-user/youtube-dl';

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
  // 0: best quality | 9: worse quality
  '--audio-quality=0',
  '--embed-thumbnail',
  // SUBTITLES
  '--all-subs',
  // FFMPEG
  `--ffmpeg-location=${ffmpegPath}`,
];

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
      err =>
        err
          ? (env === 'development' && console.error(err, path)) ||
            resolve(false)
          : resolve(true)
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
      (err, data) =>
        err ? console.error(err, path) || reject(err) : resolve(data)
    );
  });
}

function removeFileAsync(path) {
  return new Promise((resolve, reject) => {
    unlink(
      path,
      err => (err ? console.error(err, path) || reject(err) : resolve())
    );
  });
}

function makeCleanup(event, output) {
  return function doCleanup() {
    console.info(`Received event ${event} for ${output}`);
    console.info('Removing temporary files ...');
    glob(join(destPath, `${output}*`), { absolute: true }, function(
      err,
      files
    ) {
      if (err) {
        console.error(err);
        return;
      }

      if (!Array.isArray(files) || !files.length) {
        console.error(new Error('Mhhh, no files to cleanup'));
        return;
      }

      files.forEach(async function(file) {
        console.debug(`Now removing ${file} ...`);
        try {
          await removeFileAsync(file);
          console.info(`Successfuly removed ${file}`);
        } catch (err) {
          console.error(`Failed to remove ${file}`);
        }
      });
    });
  };
}

async function spawnYouTubeDL(url, req) {
  let aborted;
  if (req) {
    req.on('close', () => {
      aborted = true;
    });
  }

  if (!isValidURL(url)) throw new Error('Provided URL is invalid.');
  try {
    await Promise.all([
      isFileExecutable(youtubeDLPath),
      isFileExecutable(ffmpegPath),
    ]);
  } catch (err) {
    throw new Error('Cannot execute download utility.');
  }

  const output = createHash('sha256')
    .update(url, 'utf8')
    .digest('hex');

  const cProcessPromise = new Promise(function(resolve, reject) {
    const cProcess = spawn(youtubeDLPath, [
      url,
      `--output=${join(destPath, output)}.%(ext)s`,
      ...executableArgs,
    ]);

    setTimeout(() => {
      if (!this.done) {
        cProcess.kill('SIGHUP');
        reject(new Error('Process timeout.'));
      }
    }, 1000 * 60 * 3);

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
      resolve();
    });
  });

  try {
    await cProcessPromise;
  } catch (err) {
    console.error(err);
    makeCleanup(err.name, output)();
  }
  spawn.done = true;

  const readOK = await isFileReadable(join(destPath, `${output}.mp3`));
  if (readOK) {
    if (aborted) {
      makeCleanup('abort', output)();
    }

    console.info('Retrieving mp3 file stream...');
    const fileStream = createReadStream(join(destPath, `${output}.mp3`));

    fileStream.on('end', makeCleanup('fileStream.on(\'end\')', output));
    fileStream.on('error', makeCleanup('fileStream.on(\'error\')', output));

    const ret = {
      title: 'Untitled file',
      fileStream,
    };

    try {
      ret.title = JSON.parse(
        await readFileAsync(join(destPath, `${output}.info.json`))
      ).title;
    } catch (err) {
      // no error handling necessary here.
    }

    return ret;
  }

  throw new Error('Could not read audio extract file.');
}

module.exports = {
  spawnYouTubeDL,
  isFileReadable,
};
