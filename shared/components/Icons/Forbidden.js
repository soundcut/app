const { wire } = require('hypermorphic');

function Forbidden(id = 'default') {
  return wire(Forbidden, `:${id}`)`
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
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
  `;
}

module.exports = Forbidden;
