import { decode } from 'punycode';

export default function getDisplayName(str) {
  let ret = str;
  try {
    ret = decode(str);
  } catch (err) {
    // pass
  }

  return ret || 'Untitled';
}
