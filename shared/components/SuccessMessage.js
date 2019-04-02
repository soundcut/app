const { wire } = require('hypermorphic');

function SuccessMessage(messages_ = 'Yay, success!') {
  const messages = Array.isArray(messages_)
    ? messages_.filter(Boolean)
    : [messages_];

  return wire()`
    <p class="Success">
      ${messages.map(message => wire()`${message} <br/>`)}
    </p>
  `;
}

module.exports = SuccessMessage;
