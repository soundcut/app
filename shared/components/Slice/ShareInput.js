const { wire } = require('hypermorphic');

function ShareInput(id) {
  const url = `${window.location.origin}/slice/${id}`;
  const shortUrl = `${window.location.origin}/slice/${id.slice(0, 10)}`;
  return wire()`
  <p>
    <label for="share" class="flex flex-justify-content-between">
      <span>Sharing link for this slice:</span>
      <a href="${url}">
        Go to this slice
      </a>
    </label>
    <input id="share" class="full-width" type="text" value=${shortUrl} />
  </p>
  `;
}

module.exports = ShareInput;
