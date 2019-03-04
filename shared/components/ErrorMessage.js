const { wire } = require('hypermorphic');

function ErrorMessage(messages_ = 'Oops! Something went wrong.') {
  const messages = Array.isArray(messages_) ? messages_ : [messages_];

  return wire()`<p class="Error">
    ${messages.map(message => wire()`${message} <br/>`)}
  </p>`;
}

module.exports = ErrorMessage;
