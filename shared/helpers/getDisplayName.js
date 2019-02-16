const { decode } = require('punycode');

module.exports = function getDisplayName(str) {
  let ret = str;
  try {
    ret = decode(str);
  } catch (err) {
    // pass
  }

  return ret || 'Untitled';
};
