/**
 * Appends two AudioBuffers into a new one.
 *
 * @param {AudioContext} context audio context to create new buffer from.
 * @param {AudioBuffer} buffer1 The first buffer.
 * @param {AudioBuffer} buffer2 The second buffer.
 */
function concatAudioBuffer(context, buffer1, buffer2) {
  const numberOfChannels = Math.min(
    buffer1.numberOfChannels,
    buffer2.numberOfChannels
  );
  const tmp = context.createBuffer(
    numberOfChannels,
    buffer1.length + buffer2.length,
    buffer1.sampleRate
  );
  for (let i = 0; i < numberOfChannels; i++) {
    const channel = tmp.getChannelData(i);
    channel.set(buffer1.getChannelData(i), 0);
    channel.set(buffer2.getChannelData(i), buffer1.length);
  }
  return tmp;
}

module.exports = concatAudioBuffer;
