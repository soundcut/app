const { wire } = require('hypermorphic');
const SuccessMessage = require('./SuccessMessage');

function SavedAlert(hash) {
  const messages = [
    'This slice has been saved to your browser.',
    wire()`It is now available on the <a href="/">home screen</a>.`,
    wire()`<a href="${`/saved/slice/${hash}`}">Go to slice</a>.`,
  ];

  return SuccessMessage(messages);
}

module.exports = SavedAlert;
