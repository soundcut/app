const { wire } = require('hypermorphic');
const Headphones = require('../Icons/Headphones');
const humanizeFileSize = require('../../helpers/humanizeFileSize');
const getDisplayName = require('../../helpers/getDisplayName');
const formatTime = require('../../helpers/formatTime');

/* eslint-disable indent */
function ListItem({ type, item }) {
  return wire()`
    <li>
      <a href="${`/saved/${type}/${item.key}`}"
         class="flex flex-justify-content-between flex-items-center"
      >
        <strong>
          ${getDisplayName(item.file.name)}
        </strong>
        <em class="flex flex-items-center">
          <span>
            ${
              typeof item.duration === 'undefined'
                ? ''
                : formatTime(item.duration)
            }
          </span>        
          <span>
            ${humanizeFileSize(item.file.size)}
          </span>
          ${Headphones()}
        </em>
      </a>
    </li>
  `;
}

module.exports = ListItem;
