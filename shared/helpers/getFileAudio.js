function isMediaLoaded(media) {
  const seekable = !!media && media.seekable;
  return (
    seekable &&
    seekable.length > 0 &&
    media.seekable.start(0) === 0 &&
    seekable.end(0) === media.duration
  );
}

function getFileAudio(file) {
  return new Promise(resolve => {
    const objectURL = URL.createObjectURL(file);
    const audio = new Audio(objectURL);
    const interval = setInterval(() => {
      if (isMediaLoaded(audio)) {
        clearInterval(interval);
        URL.revokeObjectURL(this.objectURL);
        resolve(audio);
      }
    }, 100);
  });
}

module.exports = getFileAudio;
