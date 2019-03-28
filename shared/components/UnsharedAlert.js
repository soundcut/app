const { wire } = require('hypermorphic');

/* eslint-disable indent */
function UnsharedAlert() {
  return wire(UnsharedAlert)`
    <h3>
      This slice is no longer saved on the server.
    </h3>
    <p>
      Sharing the <strong>current URL</strong> <strong>no longer works</strong>.
      <br />
      If you wish to keep access to this slice for <strong>yourself</strong>, you can <strong>download it</strong> or <strong>save it in this browser</strong>.
      <br />
      If unsharing this slice was a <strong>mistake</strong>, you can <strong>share</strong> it again.      
    </p>
  `;
}

module.exports = UnsharedAlert;
