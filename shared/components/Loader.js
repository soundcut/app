import { wire } from 'hypermorphic';
import LoaderIcon from './Icons/Loader.js';

export default function Loader(message = 'Loading... Please wait.') {
  return wire()`
    <div class="Loader">
      <p>${message}</p>
      ${LoaderIcon()}
    </div>
  `;
}
