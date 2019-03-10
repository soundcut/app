const { wire } = require('hypermorphic');

function ShareInput(id) {
  const url = `${window.location.origin}/slice/${id}`;
  return wire()`
  <p>
    <label for="share" class="flex flex-justify-content-between">
      <span>Sharing link for this slice:</span>
      <a href="${url}">
        Go to this slice
      </a>
    </label>
    <input id="share" class="full-width" type="text" value=${url} />
  </p>
  `;
}

module.exports = ShareInput;
