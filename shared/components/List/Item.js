import { wire } from 'hypermorphic';
import Headphones from '../Icons/Headphones.js';
import humanizeFileSize from '../../helpers/humanizeFileSize.js';
import getDisplayName from '../../helpers/getDisplayName.js';
import formatTime from '../../helpers/formatTime.js';

/* eslint-disable indent */
export default function ListItem({ type, item }) {
  const url =
    type == 'shared' ? `/shared/${item.key}` : `/saved/${type}/${item.key}`;

  return wire(item, `:${item.key}`)`
    <li>
      <a
        href="${url}"
        class="flex flex-justify-content-between flex-items-center"
      >
        <strong>${getDisplayName(item.filename)}</strong>
        <em class="flex flex-items-center">
          <span>
            ${
              typeof item.duration === 'undefined'
                ? ''
                : formatTime(item.duration)
            }
          </span>
          <span>${humanizeFileSize(item.filesize)}</span>
          ${Headphones(item, item.key)}
        </em>
      </a>
    </li>
  `;
}
