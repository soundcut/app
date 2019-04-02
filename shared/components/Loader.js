const { wire } = require('hypermorphic');
const LoaderIcon = require('./Icons/Loader');

function Loader(message = 'Loading... Please wait.') {
  return wire()`
    <div class="Loader">
      <p>${message}</p>
      ${LoaderIcon()}
    </div>
  `;
}

module.exports = Loader;
