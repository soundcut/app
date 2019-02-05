function getDuration(byteLength, bitrate) {
  return (byteLength * 8) / bitrate / 1000;
}

module.exports = getDuration;
