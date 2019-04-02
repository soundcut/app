/* eslint-disable indent */
/* prettier-ignore-start */
const { Component, wire } = require('hypermorphic');
const ErrorMessage = require('./ErrorMessage');
const UploadIcon = require('./Icons/Upload');

const requiredFileTypes = ['audio/mpeg', 'audio/mp3'];
const humanizedRequiredFileType = requiredFileTypes.join(', ');
const fileSizeLimit = 1048576 * 1000;

function preventDefaultDrag(evt) {
  evt.preventDefault();
  evt.stopPropagation();
}

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
  dragging: false,
  file: undefined,
};

class Upload extends Component {
  constructor(onFileValid) {
    super();
    this.state = Object.assign({}, initialState);
    this.onFileValid = onFileValid;
    this.handleChange = this.handleChange.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  onconnected() {
    const form = document.querySelector('form');
    [
      'drag',
      'dragstart',
      'dragend',
      'dragover',
      'dragenter',
      'dragleave',
      'drop',
    ].forEach(function(evt) {
      form.addEventListener(evt, preventDefaultDrag, false);
    });
    ['dragover', 'dragenter'].forEach(
      function(evt) {
        form.addEventListener(evt, this.handleDragStart, false);
      }.bind(this)
    );
    ['dragleave', 'dragend'].forEach(
      function(evt) {
        form.addEventListener(evt, this.handleDragEnd, false);
      }.bind(this)
    );
    form.addEventListener('drop', this.handleDrop, false);
  }

  handleDragStart() {
    if (!this.state.dragging) {
      this.setState({ dragging: true });
    }
  }

  handleDragEnd() {
    if (this.state.dragging) {
      this.setState({ dragging: false });
    }
  }

  handleDrop(evt) {
    this.handleFile(evt.dataTransfer.files[0]);
  }

  handleFile(file) {
    this.setState({
      file,
    });

    if (isFileValid(file)) {
      this.onFileValid(file);
    }
  }

  handleChange(evt) {
    const target = evt.target;
    const file = target.files[0];

    this.handleFile(file);
  }

  render() {
    const state = this.state;
    const file = state.file;

    const fileFieldClass = `FileField ${state.dragging ? 'is-dragging' : ''}`;

    return this.html`
      <form onconnected=${this} enctype="multipart/form-data" method="post">
        <fieldset class="${fileFieldClass}">
          <legend>
            <span>Upload a file</span>
            <em>Click to browse or Drag and Drop</em>
          </legend>
          ${file
            ? [
                !isFileSizeValid(file.size) && InvalidFileSize(file.size),
                !isFileTypeValid(file.type) && InvalidFileType(file.type),
              ].filter(Boolean)
            : ''}
          <input
            onChange=${this.handleChange}
            type="file"
            id="source"
            name="source"
            accept=${requiredFileTypes[0]}
          />
          <label for="source">
            ${UploadIcon()}
            <span>
              <span>Source material</span>
              <em>${humanizedRequiredFileType}</em>
            </span>
          </label>
        </fieldset>
      </form>
    `;
  }
}

module.exports = Upload;
