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
  owner,
  disabled,
  mediaIsLoaded,
  handleSave,
  handleShare,
  handleUnshare,
  handleDelete,
  handleDownload,
}) {
  const soundButton = saved
    ? wire(SourceActions, ':delete-button')`
      <button
        disabled=${disabled}
        onClick=${handleDelete}
        title="Delete from the browser."
        class="button--xsmall button--withicon button--danger"
      >
        ${Cross('sand', 'source-actions--sound-button')} <span>Delete</span>
      </button>
    `
    : wire(SourceActions, ':save-button')`
      <button
        disabled=${disabled}
        onClick=${handleSave}
        title="Save in the browser."
        class="button--xsmall button--withicon"
      >
        ${Floppy('source-actions')} <span>Save</span>
      </button>
    `;

  const sharedOwner = shared && owner;
  const shareAllowed =
    shareAllowedTypes.indexOf(type) > -1 && (!shared || sharedOwner);
  let shareButton = '';
  if (shareAllowed) {
    const className = `button--xsmall button--withicon ${
      sharedOwner ? 'button--danger' : ''
    }`;
    const icon = sharedOwner
      ? Cross('sand', 'source-actions--share-button')
      : Share('source-actions');
    shareButton = wire(SourceActions, ':share-button')`
      <button
        disabled=${disabled}
        onClick=${sharedOwner ? handleUnshare : handleShare}
        class="${className}"
      >
        ${icon} <span>${sharedOwner ? 'Unshare' : 'Share'}</span>
      </button>
    `;
  }

  return wire(SourceActions, ':root')`
    <div class="button-container padding-y-xsmall flex flex-grow1 flex-justify-content-end">
      <button
        disabled=${!mediaIsLoaded}
        onClick=${handleDownload}
        title="Download file."
        class="button--xsmall button--withicon"
      >
        ${Download('source-actions')} <span>Download</span>
      </button>
      ${shareButton}
      ${soundButton}
    </div>
  `;
}

module.exports = SourceActions;
