import { wire } from 'hypermorphic';

export default function Upload(id = 'default') {
  return wire(Upload, `:${id}`)`
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
      <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 4.2v10.3" />
    </svg>
  `;
}
