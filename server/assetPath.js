import fs from 'fs';
import url from 'url';
import path from 'path';

export default function makeAssetPath(base, publicDir) {
  const assetsManifestPath = path.join(__dirname, '..', 'dist/assets.json');
  const assets = JSON.parse(fs.readFileSync(assetsManifestPath, 'utf8'));

  return function assetPath(asset, absolute = true) {
    const pathname = assets[asset] || asset;
    if (!absolute) {
      return pathname;
    }

    return url.resolve(base, path.join(publicDir, pathname));
  };
}
