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

function isFileSizeValid(bytes) {
  return bytes > 0 && bytes <= fileSizeLimit;
}

function isFileTypeValid(type) {
  return requiredFileTypes.indexOf(type) > -1;
}

function isFileValid(file) {
  return !!(file && isFileSizeValid(file.size) && isFileTypeValid(file.type));
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

    if (isFileValid(file)) {
      this.setState({
        file,
      });
    }
  }

  render() {
    const state = this.state;
    const file = state.file;
    const fileIsValid = isFileValid(file);
    return this.html`
      <form onconnected=${this}
            onSubmit=${this.handleSubmit}
            onReset=${this.handleReset}
            enctype="multipart/form-data"
            method="post"
            action="${uploadPath}"
      >
        ${[
          file && !isFileSizeValid(file.size) ? InvalidFileSize(file.size) : '',
        ]}
        ${[
          file && !isFileTypeValid(file.type) ? InvalidFileType(file.type) : '',
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
        ${[isFileValid(file) ? new LocalPlay(file) : '']}
        <p hidden>
          <button type="reset">
            Reset
          </button>
          <button type="submit"
                  disabled="${!isFileValid(file)}"
          >
            Upload
          </button>
        </p>
      </form>
    `;
  }
}

module.exports = Upload;
