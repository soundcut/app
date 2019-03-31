function withMediaSession(fn) {
  if ('mediaSession' in navigator) {
    fn();
  }
}

module.exports = withMediaSession;
