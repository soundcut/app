const { Component, wire } = require('hypermorphic');

const initialState = {
  mode: undefined,
  localDescription: undefined,
};

class Settings extends Component {
  constructor() {
    super();
    this.state = Object.assign({}, initialState);
    this.create = this.create.bind(this);
    this.setMode = this.setMode.bind(this);
    this.submitRemoteDescription = this.submitRemoteDescription.bind(this);
    this.join = this.join.bind(this);
  }

  onconnected() {
    document.title = 'Soundcut | Settings';
  }

  setMode(evt) {
    evt.preventDefault();
    const mode = evt.currentTarget.getAttribute('data-mode');
    this.peerConnection = new RTCPeerConnection({ iceServers: [] });

    this.setState({
      mode,
    });

    this[mode]();
  }

  async create() {
    const peerConnection = this.peerConnection;
    const dataChannel = peerConnection.createDataChannel('sync');
    dataChannel.onmessage = function(e) {
      console.log('DC message:' + e.data);
    };
    dataChannel.onopen = function() {
      console.log('------ DATACHANNEL OPENED ------');
    };
    dataChannel.onclose = function() {
      console.log('------- DC closed! -------');
    };
    dataChannel.onerror = function() {
      console.log('DC ERROR!!!');
    };

    const offer = await peerConnection.createOffer();
    peerConnection.setLocalDescription(offer);
    peerConnection.addEventListener(
      'icecandidate',
      function onicecandidate(evt) {
        if (evt.candidate == null) {
          this.setState({ localDescription: peerConnection.localDescription });
        }
      }.bind(this)
    );
  }

  async join() {
    const peerConnection = this.peerConnection;

    peerConnection.ondatachannel = function(event) {
      const dataChannel = event.channel;
      dataChannel.onmessage = function(e) {
        console.log('DC message:' + e.data);
      };
      dataChannel.onopen = function() {
        console.log('------ DATACHANNEL OPENED ------');
      };
      dataChannel.onclose = function() {
        console.log('------- DC closed! -------');
      };
      dataChannel.onerror = function() {
        console.log('DC ERROR!!!');
      };
    };
  }

  async submitRemoteDescription(evt) {
    evt.preventDefault();
    const form = evt.target;
    const input = form.querySelector('textarea');
    const value = input.value;
    const remoteDescription = JSON.parse(window.atob(value));
    this.setState({
      remoteDescription,
    });
    await this.peerConnection.setRemoteDescription(remoteDescription);

    if (this.state.mode === 'join') {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      const localDescription = this.peerConnection.localDescription;
      this.setState({
        localDescription,
      });
    }
  }

  decorateContent(...children) {
    return this.html`
      <section onconnected=${this}>
        ${children.filter(Boolean)}
      </section>
    `;
  }

  render() {
    if (!this.state.mode) {
      return this.decorateContent(
        wire()`
          <p class="button-container">
            <button
              type="button"
              data-mode="create"
              class="full-width"
              onclick=${this.setMode}
            >
              CREATE
            </button>
            <button
              type="button"
              data-mode="join"
              class="full-width"
              onclick=${this.setMode}
            >
              JOIN
            </button>
          </p>
        `
      );
    }

    this.decorateContent(
      this.state.localDescription
        ? wire()`
          <p>
            <label for="localDescription">localDescription</label>
            <input
              readonly
              type="text"
              class="full-width"
              id="localDescription"
              value=${window.btoa(JSON.stringify(this.state.localDescription))}
            >
          </p>
        `
        : '',
      !this.state.remoteDescription
        ? wire()`
            <form onsubmit=${this.submitRemoteDescription}>
              <label for="remoteDescription">remoteDescription</label>
              <textarea class="full-width" id="remoteDescription" />
              <button class="full-width">Establish</button>
            </form>
          `
        : ''
    );
  }
}

module.exports = Settings;
