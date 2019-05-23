import { wire } from 'hypermorphic';
import SuccessMessage from './SuccessMessage.js';

export default function SharedAlert(id) {
  const url = `${window.location.origin}/shared/${id.slice(0, 10)}`;

  const messages = [
    'This slice has been saved on the server.',
    wire(SharedAlert, ':input')`
      <label for="share" class="flex flex-justify-content-between">
        Sharing link for this slice
      </label>
      <input id="share" class="full-width" type="text" value=${url} />
    `,
    wire(SharedAlert, ':link')`
      <a href="${url}">Go to slice</a>.
    `,
  ];

  return SuccessMessage(messages);
}
