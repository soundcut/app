const { encode } = require('punycode');
const getDisplayName = require('./getDisplayName');

function getSliceName(file, start, end) {
  const filename = getDisplayName(file.name);
  return encode(`${filename} [${`${start}-${end}`}]`);
}

module.exports = getSliceName;
