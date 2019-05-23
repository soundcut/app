import { wire } from 'hypermorphic';

export default function Ready() {
  return wire(Ready)`<h2>Your slice is ready!</h2>`;
}
