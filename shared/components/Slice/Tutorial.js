const { wire } = require('hypermorphic');

function Tutorial() {
  return wire(Tutorial)`<h3>What now? Create a slice!</h3>
  <ol>
    <li>
      Drag handles to select the boundaries (start and end) of your slice.
    </li>
    <li>Submit your slice.</li>
    <li>Choose a name for your slice if you want.</li>
    <li>Save, share, download or simply listen to your slice!</li>
  </ol>`;
}

module.exports = Tutorial;
