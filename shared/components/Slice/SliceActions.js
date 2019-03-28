const { wire } = require('hypermorphic');

const Download = require('../Icons/Download');
const Floppy = require('../Icons/Floppy');
const Cross = require('../Icons/Cross');
const Share = require('../Icons/Share');

function SliceActions({
  saved,
  shared,
  disabled,
  submitted,
  toggleSave,
  handleShare,
  handleDownload,
}) {
  if (!submitted) {
    return '';
  }

  const soundButton = saved
    ? wire(SliceActions, ':delete-button')`
    <button
      disabled=${disabled}
      onClick=${toggleSave}
      title="Delete from the browser."
      class="button--xsmall button--withicon button--danger"
    >
      ${Cross('sand')} <span>Delete</span>
    </button>
    `
    : wire(SliceActions, ':save-button')`
    <button
      disabled=${disabled}
      onClick=${toggleSave}
      title="Save in the browser."
      class="button--xsmall button--withicon"
    >
      ${Floppy()} <span>Save</span>
    </button>
    `;

  const shareButton = wire(SliceActions, ':share-button')`
    <button
      disabled=${disabled || shared}
      onClick=${handleShare}
      title="A unique URL will be generated for you to share your slice."
      class="button--xsmall button--withicon"
    >
      ${Share()} <span>Share</span>
    </button>
    `;

  return wire(SliceActions, ':slice-actions')`
    <div class="button-container padding-y-xsmall margin-bottom flex flex-grow1 flex-justify-content-end">
      <button
        disabled=${disabled}
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

module.exports = SliceActions;
