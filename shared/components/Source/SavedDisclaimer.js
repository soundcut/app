const { wire } = require('hypermorphic');

/* eslint-disable indent */

function SavedDisclaimer(type) {
  return wire()`<h3>This ${type} is saved in your browser</h3>
  <p>
    It is only accessible <strong>by you on this browser</strong>.
    <br />
    Sharing the <strong>current URL</strong> with others or accessing it in a
    different browser <strong>will not work</strong>.
  </p>
  ${type === 'slice'
    ? wire()`
        <p>
          You can <strong>share</strong>, <strong>download</strong>,
          <strong>play</strong> this <strong>${type}</strong> or
          <strong>delete</strong> it using the actions below.
          <br />
          You can also use it as a <strong>source</strong> and create a new
          slice out of it.
        </p>
      `
    : ''}`;
}

module.exports = SavedDisclaimer;
