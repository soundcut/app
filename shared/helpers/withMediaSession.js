export default function withMediaSession(fn) {
  if ('mediaSession' in navigator) {
    fn();
  }
}
