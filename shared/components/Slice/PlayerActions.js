const { wire } = require('hypermorphic');

const Play = require('../Icons/Play');
const Pause = require('../Icons/Pause');
const Check = require('../Icons/Check');
const Cross = require('../Icons/Cross');

/* eslint-disable indent */
function PlayerActions({
  submitted,
  disabled,
  paused,
  handleSubmitClick,
  handlePlayPauseClick,
  handleDismissClick,
}) {
  return wire(PlayerActions, ':PlayerActions')`
    <div class="flex flex-direction-column">
      <button type="button"
        disabled=${disabled}
        onclick=${handlePlayPauseClick}
      >
        ${disabled || paused ? Play() : Pause()}
      </button>
      <button type="button"
        onClick=${handleSubmitClick}
        disabled=${disabled}
        title="Create the slice for the selected boundaries"
      >
        ${Check()}
      </button>
      ${
        submitted
          ? wire(PlayerActions, ':dismiss')`
          <button type="button"
            onClick=${handleDismissClick}
            disabled=${disabled}
            title="Dismiss slice"
          >
            ${Cross()}
          </button>
        `
          : ''
      }
    </div>
  `;
}

module.exports = PlayerActions;
