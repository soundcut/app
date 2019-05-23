import { wire } from 'hypermorphic';

// stroke = $color-green;
export default function Headphones(ref, id, stroke = '#37f0c2') {
  return wire(ref, `:${id}`)`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${stroke}"
      stroke-width="2"
      stroke-linecap="square"
      stroke-linejoin="arcs"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  `;
}
