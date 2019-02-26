/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');
const ErrorMessage = require('./ErrorMessage');

const requiredFileTypes = ['audio/mpeg', 'audio/mp3'];
const humanizedRequiredFileType = requiredFileTypes.join(', ');
const fileSizeLimit = 1048576 * 1000;

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

  const message = wire()`
    File selected is bigger (<strong>${actual}</strong>)
    than maximum size (<strong>${limit}</strong>).
  `;

  return ErrorMessage(message);
}

function InvalidFileType(type) {
  const message = wire()`
    Selected file type (<strong>${type}</strong>) is not supported.
    <br />
    Please upload a <strong>${humanizedRequiredFileType}</strong> file.
  `;

  return ErrorMessage(message);
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
};

class Upload extends Component {
  constructor(onFileValid) {
    super();
    this.onFileValid = onFileValid;
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(evt) {
    const target = evt.target;
    const file = target.files[0];

    this.setState({
      file,
    });

    if (isFileValid(file)) {
      this.onFileValid(file);
    }
  }

  render() {
    const state = this.state;
    const file = state.file;

    return this.html`
      <form enctype="multipart/form-data"
            method="post"
      >
        ${
          file
            ? [
                !isFileSizeValid(file.size) && InvalidFileSize(file.size),
                !isFileTypeValid(file.type) && InvalidFileType(file.type),
              ].filter(Boolean)
            : ''
        }
        <fieldset class="FileField">
          <legend>
            <span>Upload a file</span>
            <em>Click to browse or Drag and Drop</em>
          </legend>
          <input onChange=${this.handleChange}
            type="file"
            id="source"
            name="source"
            accept=${requiredFileTypes[0]}
          />
          <label for="source">
            Source material <em>${humanizedRequiredFileType}</em>
          </label>
        </fieldset>
      </form>
    `;
  }
}

module.exports = Upload;
