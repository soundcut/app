const { wire } = require('hypermorphic');

function Advanced({ id, onChange }) {
  return wire(id)`
    <details>
      <summary>Advanced settings</summary>
      <div class="flex">
        <input type="checkbox"
               name="overwrite-metadata"
               id="overwrite-metadata"
               value="1"
               checked="true"
               onChange=${onChange}
        />
        <label for="overwrite-metadata">Overwrite metadata?</label>
      </div>
    </details>
  `;
}

module.exports = Advanced;
