const { wire } = require('hypermorphic');
const LoaderIcon = require('./Icons/Loader');

function Loader(message = 'Loading... Please wait.') {
  return wire()`
    <p class="Loader">
      ${message}
      <br />
      ${LoaderIcon()}
    </p>
  `;
}

module.exports = Loader;
