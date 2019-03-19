function hexString(buffer) {
  const byteArray = new Uint8Array(buffer);

  const hexCodes = [...byteArray].map(value => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, '0');
    return paddedHexCode;
  });

  return hexCodes.join('');
}

async function getFileHash(file) {
  const fileReader = new FileReader();
  const arrayBuffer = await new Promise((resolve, reject) => {
    fileReader.onloadend = function onFileReaderLoadEnd() {
      resolve(fileReader.result);
    };

    fileReader.readAsArrayBuffer(file);
  });

  const digest = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  return hexString(digest).slice(0, 10);
}

module.exports = getFileHash;
