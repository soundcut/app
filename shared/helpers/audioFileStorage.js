import getFileHash from './getFileHash.js';
import { setItem, deleteItem } from './indexedDB.js';

export async function saveAudioFile(type, audio, file) {
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

export async function deleteAudioFile(type, key, file) {
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
