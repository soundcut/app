const { getFileAudioBuffer } = require('@soundcut/decode-audio-data-fast');

async function decodeFileAudioData(file) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return getFileAudioBuffer(file, audioCtx);
}

module.exports = decodeFileAudioData;
