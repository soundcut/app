const getFileAudioBuffer = require('./getFileAudioBuffer');

async function decodeFileAudioData(file) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return await getFileAudioBuffer(file, audioCtx);
}

module.exports = decodeFileAudioData;
