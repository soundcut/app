const { wire } = require('hypermorphic');

function Ready() {
  return wire(Ready)`
    <h2>
      Your slice is ready!
    </h2>
  `;
}

module.exports = Ready;
