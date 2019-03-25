const { unlink, rename } = require('fs');

function renameAsync(oldPath, newPath) {
  return new Promise((resolve, reject) => {
    rename(oldPath, newPath, err => (err ? reject(err) : resolve()));
  });
}

function unlinkAsync(path) {
  return new Promise((resolve, reject) => {
    unlink(path, err => (err ? reject(err) : resolve()));
  });
}

module.exports = {
  renameAsync,
  unlinkAsync,
};
