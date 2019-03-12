function ensureMinWidthViewport(minWidth = 835) {
  if (window.matchMedia(`(min-width: ${minWidth}px)`).matches) {
    return;
  }

  const viewport = document.querySelector('meta[name=viewport]');
  const content = viewport.getAttribute('content');
  console.log(content);
  const parts = content.split(',');
  const rest = parts.slice(1, parts.length).join(',');
  document.head.removeChild(viewport);
  const newViewport = document.createElement('meta');
  newViewport.setAttribute('name', 'viewport');
  newViewport.setAttribute('content', `width=${minWidth}, ${rest}`);
  document.head.appendChild(newViewport);
}

module.exports = ensureMinWidthViewport;
