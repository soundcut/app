const { wire } = require('hypermorphic');
const Play = require('../Icons/Play');
const Pause = require('../Icons/Pause');
const Download = require('../Icons/Download');
const Share = require('../Icons/Share');
const Check = require('../Icons/Check');

/* eslint-disable indent */
function PlayerActions({
  submitted,
  disabled,
  paused,
  sharing,
  handleSubmit,
  handlePlayPauseClick,
  handleDownloadClick,
  handleShareClick,
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
              onclick=${handleSubmit}
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
    </div>
  `;
}
/* eslint-enable indent */

module.exports = PlayerActions;
