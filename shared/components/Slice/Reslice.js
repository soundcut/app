const { wire } = require('hypermorphic');

function Reslice() {
  return wire()`
    <h3>
      Not satisfied with your slice?
    </h3>
    <p>
      You can <strong>dismiss</strong> or <strong>keep slicing</strong> this slice and do it better!
    </p>
    <h3>
      Want to create a new slice?
    </h3>
    <p>
      You can <strong>save</strong> this slice and then use it as a <strong>source</strong> to create a new slice out of it.
    </p>
  `;
}

module.exports = Reslice;
