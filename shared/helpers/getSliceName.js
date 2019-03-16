const getDisplayName = require('./getDisplayName');

function getSliceName(file, start, end) {
  const filename = getDisplayName(file.name);
  return `${filename} [${`${start}-${end}`}]`;
}

module.exports = getSliceName;
