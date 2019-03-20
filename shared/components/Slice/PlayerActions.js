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
  const playPauseButton = wire()`
    <button type="button"
      disabled=${disabled}
      onclick=${handlePlayPauseClick}
    >
      ${disabled || paused ? Play() : Pause()}
    </button>
  `;

  const actionButton = wire()`
    <button type="button"
      onClick=${submitted ? handleDismissClick : handleSubmitClick}
      disabled=${disabled}
      title=${
        submitted
          ? 'Dismiss slice'
          : 'Create the slice for the selected boundaries'
      }
    >
      ${submitted ? Cross() : Check()}
    </button>
  `;

  return wire()`
    <div class="flex flex-direction-column">
      ${playPauseButton}
      ${actionButton}
    </div>
  `;
}

module.exports = PlayerActions;
