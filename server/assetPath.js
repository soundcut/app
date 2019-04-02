const fs = require('fs');
const url = require('url');
const path = require('path');

const assetsManifestPath = path.join(__dirname, '..', 'dist/assets.json');
const assets = JSON.parse(fs.readFileSync(assetsManifestPath, 'utf8'));

function makeAssetPath(base, publicDir) {
  return function assetPath(asset, absolute = true) {
    const pathname = assets[asset] || asset;
    if (!absolute) {
      return pathname;
    }

    return url.resolve(base, path.join(publicDir, pathname));
  };
}

module.exports = makeAssetPath;
