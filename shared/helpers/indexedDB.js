let db;

const init = () =>
  new Promise((resolve, reject) => {
    if (!db) {
      const name = 'soundslice';
      const version = 1;
      const openRequest = window.indexedDB.open(name, version);

      openRequest.onsuccess = () => {
        db = openRequest.result;
        resolve();
      };

      openRequest.onerror = () =>
        reject(
          new Error(`Unable to open or create indexedDB ${name}, v${version}`)
        );

      openRequest.onupgradeneeded = event => {
        try {
          event.target.result.deleteObjectStore('slices');
        } catch (err) {
          /* pass */
        }
        event.target.result.createObjectStore('slices', {
          keyPath: 'key',
        });
      };
    } else {
      resolve();
    }
  });

const getStore = () =>
  db.transaction('slices', 'readwrite').objectStore('slices');

const doGetItem = key => {
  return new Promise((resolve, reject) => {
    const request = getStore().get(key);
    request.onsuccess = evt => resolve(evt.target.result && evt.target.result);
    request.onerror = err => reject(err);
  });
};
const doSetItem = item => {
  return new Promise((resolve, reject) => {
    const request = getStore().put(item);
    request.onsuccess = evt => resolve(evt.target.result && evt.target.result);
    request.onerror = err => reject(err);
  });
};
const doGetAllItems = () => {
  return new Promise((resolve, reject) => {
    const request = getStore().getAll();
    request.onsuccess = evt => resolve(evt.target.result);
    request.onerror = err => reject(err);
  });
};

const getItem = key => init().then(() => doGetItem(key));
const setItem = item => init().then(() => doSetItem(item));
const getAllItems = () => init().then(() => doGetAllItems());

module.exports = { getItem, getAllItems, setItem };
