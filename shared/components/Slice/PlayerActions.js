import { wire } from 'hypermorphic';

import Play from '../Icons/Play.js';
import Pause from '../Icons/Pause.js';
import Check from '../Icons/Check.js';
import Cross from '../Icons/Cross.js';

/* eslint-disable indent */
export default function PlayerActions({
  submitted,
  disabled,
  paused,
  handleSubmitClick,
  handlePlayPauseClick,
  handleDismissClick,
}) {
  return wire(PlayerActions, ':root')`
    <div class="flex flex-direction-column">
      <button
        type="button"
        disabled=${disabled}
        onclick=${handlePlayPauseClick}
      >
        ${disabled || paused ? Play('player-actions') : Pause('player-actions')}
      </button>
      <button
        type="button"
        onClick=${handleSubmitClick}
        disabled=${disabled}
        title="Create the slice for the selected boundaries"
      >
        ${Check('player-actions')}
      </button>
      ${
        submitted
          ? wire(PlayerActions, ':dismiss')`
            <button
              type="button"
              onClick=${handleDismissClick}
              disabled=${disabled}
              title="Dismiss slice"
            >
              ${Cross('player-actions')}
            </button>
          `
          : ''
      }
    </div>
  `;
}
