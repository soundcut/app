/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');

const LocalPlay = require('./LocalPlay');

const requiredFileTypes = ['audio/mpeg', 'audio/mp3'];
const requiredFileTypeName = 'mp3';
const humanizedRequiredFileType = requiredFileTypes.join(', ');
const fileSizeLimit = 1048576 * 10;

const uploadPath = `/api/upload/${requiredFileTypeName}`;

function humanizeFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + 'bytes';
  } else if (bytes >= 1024 && bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + 'KB';
  } else if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(1) + 'MB';
  }
}

function InvalidFileSize(size) {
  const actual = humanizeFileSize(size);
  const limit = humanizeFileSize(fileSizeLimit);

  return wire({ actual, limit })`
  <p>
    File selected is bigger (<strong>${actual}</strong>)
    than maximum size (<strong>${limit}</strong>).
  </p>
  `;
}

function InvalidFileType(type) {
  return wire({ type })`
  <p>
    Selected file type (<strong>${type}</strong>) is not supported.
    <br />
    Please upload a <strong>${humanizedRequiredFileType}</strong>
  </p>
  `;
}

function ErrorMessage(error) {
  return wire({ error })`<p>${[error]}</p>`;
}

function isValidFileSize(bytes) {
  return bytes > 0 && bytes <= fileSizeLimit;
}

function isValidFileType(type) {
  return requiredFileTypes.indexOf(type) > -1;
}

function isFormValid(state) {
  return !!(
    state.file &&
    isValidFileSize(state.file.size) &&
    isValidFileType(state.file.type)
  );
}

const initialState = {
  file: undefined,
  error: undefined,
};

class Upload extends Component {
  constructor(...args) {
    super(...args);
    this.handleChange = this.handleChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.downloadTestFile = this.downloadTestFile.bind(this);
  }

  onconnected() {
    this.setState(initialState);
  }

  handleReset() {
    this.setState(initialState);
  }

  downloadTestFile(evt) {
    evt.preventDefault();
    const link = document.createElement('a');
    link.style = 'display: none;';
    link.href = '/public/soundslice-test-file.mp3';
    link.download = 'soundslice-test-file.mp3';
    document.body.appendChild(link);
    link.click();
    setTimeout(function removeDownloadLink() {
      link.parentElement.remove(link);
    }, 0);
  }

  handleChange(evt) {
    const target = evt.target;
    const file = target.files[0];

    this.setState({
      file,
    });
  }

  handleSubmit(evt) {
    // No need to submit the form ATM.
    return;
    // eslint-disable-next-line no-unreachable
    const target = evt.target;

    if (!isFormValid(this.state)) return;
    const file = this.state.file;
    const formData = new FormData(target);

    evt.preventDefault();

    fetch(uploadPath, {
      method: 'POST',
      body: formData,
    })
      .then(response => response.text())
      .then(responseText => {
        document.getElementById('metadata').textContent = JSON.stringify(
          responseText,
          null,
          '\t'
        );
      })
      .catch(error => {
        this.setState({
          error: `Error uploading the file <strong>${file.name}</strong>.`,
        });
        console.error('Error:', error);
      });
  }

  render() {
    const state = this.state;
    const file = state.file;
    return this.html`
      <form onconnected=${this}
            onSubmit=${this.handleSubmit}
            onReset=${this.handleReset}
            enctype="multipart/form-data"
            method="post"
            action="${uploadPath}"
      >
        ${[
          file && !isValidFileSize(file.size) ? InvalidFileSize(file.size) : '',
        ]}
        ${[
          file && !isValidFileType(file.type) ? InvalidFileType(file.type) : '',
        ]}
        ${[file && state.error ? ErrorMessage(state.error) : '']}
        <fieldset class="FileField">
          <legend>
            Upload a file
            <em>Click to browse or Drag and Drop</em>
            <a href="#" onClick=${this.downloadTestFile}>
              Download test audio/mp3 file...
            </a>
          </legend>
          <label for="source">
            Source material <em>${humanizedRequiredFileType}</em>
          </label>
          <input onChange=${this.handleChange}
                  type="file"
                  id="source"
                  name="source"
                  accept=${requiredFileTypes[0]}
          />
        </fieldset>
        ${[isFormValid(state) ? new LocalPlay(state.file) : '']}
        ${[isFormValid(state) ? '<pre id="metadata" />' : '']}
        <p hidden>
          <button type="reset">
            Reset
          </button>
          <button type="submit"
                  disabled="${isFormValid(state) ? false : true}"
          >
            Upload
          </button>
        </p>
      </form>
    `;
  }
}

module.exports = Upload;
