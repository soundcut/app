const { wire } = require('hypermorphic');

function Form({ id, initialValue, onChange, onFocus, onBlur }) {
  return wire(id)`
    <p>
      You can edit your slice's name before saving, downloading or sharing it.
    </p>


  <h4
    contenteditable="true"
    spellcheck="false"
    class="margin-bottom-small padding-xsmall border-dashed"
    oninput=${onChange}
    onfocus=${onFocus}
    onblur=${onBlur}
  >
    ${initialValue}
  </h4>`;
}

module.exports = Form;
