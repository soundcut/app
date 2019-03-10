const { wire } = require('hypermorphic');
const Play = require('../Icons/Play');
const Pause = require('../Icons/Pause');
const Download = require('../Icons/Download');
const Share = require('../Icons/Share');
const Check = require('../Icons/Check');
const Cross = require('../Icons/Cross');

/* eslint-disable indent */
function PlayerActions({
  submitted,
  disabled,
  paused,
  sharing,
  handleSubmitClick,
  handlePlayPauseClick,
  handleDownloadClick,
  handleShareClick,
  handleDismissClick,
}) {
  if (!submitted) {
    return wire()`
    <div class="flex flex-direction-column">
      <button type="button"
          disabled=${disabled}
          onclick=${handlePlayPauseClick}
      >
        ${disabled || paused ? Play() : Pause()}
      </button>
      <button type="button"
              disabled=${disabled}
              onclick=${handleSubmitClick}
              title="Create the slice for the selected boundaries"
      >
        ${Check()}
      </button>
    </div>
  `;
  }

  return wire()`
    <div class="flex flex-direction-column">
      <button type="button"
              disabled=${disabled}
              onclick=${handlePlayPauseClick}
      >
        ${disabled || paused ? Play() : Pause()}
      </button>
      <button type="button"
              onClick=${handleDownloadClick}
              disabled=${disabled}
              title="Download the selected slice"
      >
        ${Download()}
      </button>
      <button type="button"
              onClick=${handleShareClick}
              disabled=${disabled}
              title="${
                !sharing
                  ? 'A unique URL will be generated for you to share your slice.'
                  : 'Generating unique URL...'
              }"
      >
        ${Share()}
      </button>
      <button type="button"
              onClick=${handleDismissClick}
              disabled=${disabled}
              title="Dismiss slice"
      >
        ${Cross()}
      </button>
    </div>
  `;
}
/* eslint-enable indent */

module.exports = PlayerActions;
