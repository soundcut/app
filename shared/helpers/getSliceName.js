import { encode } from 'punycode';
import getDisplayName from './getDisplayName.js';

export default function getSliceName(file, start, end) {
  const filename = getDisplayName(file.name);
  return encode(`${filename} [${`${start}-${end}`}]`);
}
