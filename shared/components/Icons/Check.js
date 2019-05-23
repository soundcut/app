import { wire } from 'hypermorphic';

export default function Check(id = 'default') {
  return wire(Check, `:${id}`)`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#37f0c2"
      stroke-width="2"
      stroke-linecap="square"
      stroke-linejoin="arcs"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  `;
}
