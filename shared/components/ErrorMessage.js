const { wire } = require('hypermorphic');

function ErrorMessage(content = 'Oops! Something went wrong.') {
  return wire()`<p class="Error">${content}</p>`;
}

module.exports = ErrorMessage;
