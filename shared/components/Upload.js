/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');
const { encode } = require('punycode');

const LocalPlay = require('./LocalPlay');
const getDisplayName = require('../helpers/getDisplayName');

const requiredFileTypes = ['audio/mpeg', 'audio/mp3'];
const requiredFileTypeName = 'mp3';
const humanizedRequiredFileType = requiredFileTypes.join(', ');
const fileSizeLimit = 1048576 * 1000;

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
  constructor(title) {
    super();
    this.pageTitle = title;
    this.handleChange = this.handleChange.bind(this);
  }

  onconnected() {
    this.setState(initialState);
    history.replaceState({}, document.title, '/upload');
  }

  handleChange(evt) {
    const target = evt.target;
    const file = target.files[0];

    if (!isFileValid(file)) {
      this.setState({ file: undefined });
      return;
    } else {
      const filename = file.name;
      const encodedName = encode(filename);
      const historyState = { filename: encode(filename) };
      const pathname = `/upload?title=${encodedName}`;
      const newTitle = `${getDisplayName(filename)} | ${this.pageTitle}`;

      if (!this.state.file) {
        history.pushState(historyState, newTitle, pathname);
      } else {
        history.replaceState(historyState, newTitle, pathname);
      }
      document.title = newTitle;

      this.localPlay = new LocalPlay({
        file,
      });
      this.setState({
        file,
      });
    }
  }

  render() {
    const state = this.state;
    const file = state.file;
    return this.html`
      <form onconnected=${this}
            enctype="multipart/form-data"
            method="post"
            action="${uploadPath}"
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
        ${[this.localPlay || '']}
      </form>
    `;
  }
}

module.exports = Upload;
