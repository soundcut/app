module.exports = function getDisplayName(displayName, extension) {
  return displayName.split(extension).pop()
    ? `${displayName}.${extension}`
    : displayName;
};
