/**
 * Creates a new Uint8Array based on two different ArrayBuffers
 * https://gist.github.com/72lions/4528834
 *
 * @private
 * @param {ArrayBuffer} buffer1 The first buffer.
 * @param {ArrayBuffer} buffer2 The second buffer.
 * @return {ArrayBuffer} The new ArrayBuffer created out of the two.
 */
function concatArrayBuffer(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}

module.exports = concatArrayBuffer;
