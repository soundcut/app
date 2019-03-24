let db;

function createStore(db, store) {
  try {
    db.deleteObjectStore(store);
  } catch (err) {
    /* pass */
  }
  db.createObjectStore(store, {
    keyPath: 'key',
  });
}

function init() {
  return new Promise((resolve, reject) => {
    if (!db) {
      const name = 'soundslice';
      const version = 4;
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
        const db_ = event.target.result;
        createStore(db_, 'slice');
        createStore(db_, 'sound');
        createStore(db_, 'shared');
        createStore(db_, 'file');
      };
    } else {
      resolve();
    }
  });
}

const getStore = store => db.transaction(store, 'readwrite').objectStore(store);

const doGetItem = ({ key, store }) => {
  return new Promise((resolve, reject) => {
    const request = getStore(store).get(key);
    request.onsuccess = evt => resolve(evt.target.result && evt.target.result);
    request.onerror = err => reject(err);
  });
};
const doSetItem = ({ item, store }) => {
  return new Promise((resolve, reject) => {
    const request = getStore(store).put(item);
    request.onsuccess = evt => resolve(evt.target.result && evt.target.result);
    request.onerror = err => reject(err);
  });
};
const doDeleteItem = ({ key, store }) => {
  return new Promise((resolve, reject) => {
    const request = getStore(store).delete(key);
    request.onsuccess = evt => resolve(evt.target.result && evt.target.result);
    request.onerror = err => reject(err);
  });
};
const doGetAllItems = store => {
  return new Promise((resolve, reject) => {
    const request = getStore(store).getAll();
    request.onsuccess = evt => resolve(evt.target.result);
    request.onerror = err => reject(err);
  });
};

const getItem = ({ store, key }) =>
  init().then(() => doGetItem({ store, key }));
const setItem = ({ store, item }) =>
  init().then(() => doSetItem({ store, item }));
const deleteItem = ({ store, key }) =>
  init().then(() => doDeleteItem({ store, key }));
const getAllItems = store => init().then(() => doGetAllItems(store));

module.exports = { getItem, getAllItems, setItem, deleteItem };
