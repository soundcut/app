import { unlink, rename } from 'fs';

export function renameAsync(oldPath, newPath) {
  return new Promise((resolve, reject) => {
    rename(oldPath, newPath, err => (err ? reject(err) : resolve()));
  });
}

export function unlinkAsync(path) {
  return new Promise((resolve, reject) => {
    unlink(path, err => (err ? reject(err) : resolve()));
  });
}
