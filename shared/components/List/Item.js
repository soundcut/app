const { wire } = require('hypermorphic');
const Headphones = require('../Icons/Headphones');
const humanizeFileSize = require('../../helpers/humanizeFileSize');
const getDisplayName = require('../../helpers/getDisplayName');
const formatTime = require('../../helpers/formatTime');

/* eslint-disable indent */
function ListItem({ type, item }) {
  const url =
    type == 'shared' ? `/shared/${item.key}` : `/saved/${type}/${item.key}`;

  return wire()`
    <li>
      <a href="${url}"
         class="flex flex-justify-content-between flex-items-center"
      >
        <strong>
          ${getDisplayName(item.file ? item.file.name : item.filename)}
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
            ${humanizeFileSize(item.file ? item.file.size : item.filesize)}
          </span>
          ${Headphones()}
        </em>
      </a>
    </li>
  `;
}

module.exports = ListItem;
