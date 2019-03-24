const { wire } = require('hypermorphic');

/* eslint-disable indent */

function SharedDisclaimer({ id, owner }) {
  const url = `${window.location.origin}/shared/${id.slice(0, 10)}`;

  return wire()`
    <h3>
      This slice was saved on the server
    </h3>
    <p>
      It can be shared using the <strong>current URL</strong>.
      <br />
      <label for="share" class="flex flex-justify-content-between">
        Sharing link for this slice
      </label>
      <input id="share" class="full-width" type="text" value=${url} />      
    </p>
    ${
      owner
        ? wire()`
          <p>
            As the <strong>creator</strong> of this slice, <strong>only you</strong> can <strong>unshare</strong> it.
            <br />
            If you wish to keep access to this slice for <strong>yourself</strong>, you can <strong>download it</strong> or <strong>save it in this browser</strong>.
          </p>
          `
        : ''
    }
  `;
}

module.exports = SharedDisclaimer;
