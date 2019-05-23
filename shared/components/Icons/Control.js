import { Component } from 'hypermorphic';

import AlertCircle from './Icons/AlertCircle';
import Check from './Icons/Check';
import CheckCircle from './Icons/CheckCircle';
import Floppy from './Icons/Floppy';
import Forbidden from './Icons/Forbidden';
import Info from './Icons/Info';
import Link from './Icons/Link';
import List from './Icons/List';
import Loader from './Icons/Loader';
import Pause from './Icons/Pause';
import Play from './Icons/Play';
import Scissors from './Icons/Scissors';
import Settings from './Icons/Settings';
import Share from './Icons/Share';
import Start from './Icons/Start';

export default class Control extends Component {
  constructor(...args) {
    super(...args);
  }

  render() {
    return this.html`
      <section>
        <p>
          <button>
            ${AlertCircle()}
            AlertCircle
          </button>
          <br />
          <button>
            ${Check()}
            Check
          </button>
          <br />
          <button>
            ${CheckCircle()}
            CheckCircle
          </button>
          <br />
          <button>
            ${Floppy()}
            Floppy
          </button>
          <br />
          <button>
            ${Forbidden()}
            Forbidden
          </button>
          <br />
          <button>
            ${Info()}
            Info
          </button>
          <br />
          <button>
            ${Link()}
            Link
          </button>
          <br />
          <button>
            ${List()}
            List
          </button>
          <br />
          <button>
            ${Loader()}
            Loader
          </button>
          <br />
          <button>
            ${Pause()}
            Pause
          </button>
          <br />
          <button>
            ${Play()}
            Play
          </button>
          <br />
          <button>
            ${Scissors()}
            Scissors
          </button>
          <br />
          <button>
            ${Settings()}
            Settings
          </button>
          <br />
          <button>
            ${Share()}
            Share
          </button>
          <br />
          <button>
            ${Start()}
            Start
          </button>
        </p>
      </section>
    `;
  }
}
