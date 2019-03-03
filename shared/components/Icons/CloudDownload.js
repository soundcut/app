const { wire } = require('hypermorphic');

function CloudDownload() {
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
      <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8M12 19.8V12M16 17l-4 4-4-4"/>
    </svg>
  `;
}

module.exports = CloudDownload;
