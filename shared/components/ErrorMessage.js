import { wire } from 'hypermorphic';

export default function ErrorMessage(
  messages_ = 'Oops! Something went wrong.'
) {
  const messages = Array.isArray(messages_)
    ? messages_.filter(Boolean)
    : [messages_];

  return wire()`
    <p class="Error">
      ${messages.map(message => wire()`${message} <br/>`)}
    </p>
  `;
}
