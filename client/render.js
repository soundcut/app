import { bind } from 'hypermorphic';

let render;
export default function makeRender() {
  render = render || {
    main: bind(document.querySelector('main')),
  };

  return {
    main: props => render.main`${props}`,
  };
}
