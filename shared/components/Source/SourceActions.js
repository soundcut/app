const { wire } = require('hypermorphic');

const Download = require('../Icons/Download');
const Floppy = require('../Icons/Floppy');
const Cross = require('../Icons/Cross');
const Share = require('../Icons/Share');

const shareAllowedTypes = ['slice', 'shared'];

function SourceActions({
  type,
  saved,
  shared,
  disabled,
  mediaIsLoaded,
  handleSave,
  handleShare,
  handleDelete,
  handleDownload,
}) {
  const soundButton = saved
    ? wire()`
      <button
        disabled=${disabled}
        onClick=${handleDelete}
        title="Delete from the browser."
        class="button--xsmall button--withicon button--danger"
      >
        ${Cross('sand')} <span>Delete</span>
      </button>
    `
    : wire()`
      <button
        disabled=${disabled}
        onClick=${handleSave}
        title="Save in the browser."
        class="button--xsmall button--withicon"
      >
        ${Floppy()} <span>Save</span>
      </button>
    `;

  const shareButton =
    shareAllowedTypes.indexOf(type) > -1
      ? wire()`
      <button
        disabled=${disabled || shared}
        onClick=${handleShare}
        class="button--xsmall button--withicon"
      >
        ${Share()} <span>Share</span>
      </button>
    `
      : '';

  return wire()`
    <div class="button-container padding-y-xsmall flex flex-grow1 flex-justify-content-end">
      <button
        disabled=${!mediaIsLoaded}
        onClick=${handleDownload}
        title="Download file."
        class="button--xsmall button--withicon"
      >
        ${Download()} <span>Download</span>
      </button>
      ${shareButton}
      ${soundButton}
    </div>
  `;
}

module.exports = SourceActions;
