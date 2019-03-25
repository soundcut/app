const { ensureBrowserId } = require('./browserId');
const getFileHash = require('./getFileHash');
const { getItem, setItem, deleteItem } = require('./indexedDB');
const fetchSlice = require('./fetchSlice');

const SHARE_PATH = '/api/share';

async function shareSlice(file) {
  let browserId = 'anonymous';
  try {
    browserId = ensureBrowserId();
  } catch (err) {
    console.error({ err });
    /* pass */
  }

  let hash = '';
  try {
    hash = await getFileHash(file);
  } catch (err) {
    console.error({ err });
    /* pass */
  }

  if (hash) {
    try {
      const item = await getItem({
        store: 'shared',
        key: hash,
      });
      if (item) {
        try {
          await fetchSlice(item.id, true);
        } catch (err) {
          if (err.response && err.response.status === 404) {
            await deleteItem({
              store: 'shared',
              key: hash,
            });
            throw err;
          }
        }

        return item.id;
      }
    } catch (err) {
      console.error({ err });
      /* pass */
    }
  }

  const filename = file.name;
  const formData = new FormData();
  formData.append('file', file, filename);

  const promise = fetch(SHARE_PATH, {
    method: 'POST',
    body: formData,
    headers: {
      'X-Browser-Id': browserId,
    },
  });

  try {
    const response = await promise;

    if (response.status !== 201) {
      const err = new Error('Server Error');
      err.response = response;
      throw err;
    }

    const data = await response.json();
    const id = data.id;

    try {
      await setItem({
        store: 'shared',
        item: {
          key: hash,
          id,
        },
      });
    } catch (err) {
      console.error({ err });
      /* pass */
    }

    return id;
  } catch (err) {
    console.error({ err });
    throw err;
  }
}

module.exports = shareSlice;
