const getFileHash = require('./getFileHash');
const { setItem, deleteItem } = require('./indexedDB');

async function saveAudioFile(type, audio, file) {
  try {
    const hash = await getFileHash(file);
    const duration = audio.duration;
    const filesize = file.size;
    const filename = file.name;

    await Promise.all([
      setItem({
        store: type,
        item: {
          key: hash,
          duration,
          filesize,
          filename,
        },
      }),
      setItem({
        store: 'file',
        item: {
          key: hash,
          file,
        },
      }),
    ]);

    return hash;
  } catch (err) {
    console.error({ err });
    throw err;
  }
}

async function deleteAudioFile(type, key, file) {
  try {
    const hash = key || (await getFileHash(file));
    await Promise.all([
      deleteItem({
        store: type,
        key: hash,
      }),
      deleteItem({
        store: 'file',
        key: hash,
      }),
    ]);
  } catch (err) {
    console.error({ err });
    throw err;
  }
}

module.exports = { saveAudioFile, deleteAudioFile };
