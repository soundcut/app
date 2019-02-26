const { wire } = require('hypermorphic');

function Play() {
  return wire()`
    <svg xmlns="http://www.w3.org/2000/svg"
         width="24"
         height="24"
         viewBox="0 0 24 24"
         fill="none"
         stroke="#37f0c2"
         stroke-width="2"
         stroke-linecap="square"
         stroke-linejoin="arcs"
    >
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  `;
}

module.exports = Play;
