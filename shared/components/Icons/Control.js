const { Component } = require('hypermorphic');

const AlertCircle = require('./Icons/AlertCircle');
const Check = require('./Icons/Check');
const CheckCircle = require('./Icons/CheckCircle');
const Floppy = require('./Icons/Floppy');
const Forbidden = require('./Icons/Forbidden');
const Info = require('./Icons/Info');
const Link = require('./Icons/Link');
const List = require('./Icons/List');
const Loader = require('./Icons/Loader');
const Pause = require('./Icons/Pause');
const Play = require('./Icons/Play');
const Scissors = require('./Icons/Scissors');
const Settings = require('./Icons/Settings');
const Share = require('./Icons/Share');
const Start = require('./Icons/Start');

class Control extends Component {
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

module.exports = Control;
