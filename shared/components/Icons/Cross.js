import { wire } from 'hypermorphic';

function getColor(theme) {
  let color;
  switch (theme) {
  case 'sand':
    color = '#f4ffdc';
    break;
  case 'danger':
    color = '#cc0000';
    break;
  case 'primary':
  default:
    color = '#37f0c2';
  }
  return color;
}

export default function Cross(theme = 'primary', id = 'default') {
  const color = getColor(theme);

  return wire(Cross, `:${theme}-${id}`)`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${color}"
      stroke-width="2"
      stroke-linecap="square"
      stroke-linejoin="arcs"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  `;
}
