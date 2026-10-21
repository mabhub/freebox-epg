import { fireEvent, renderHook } from '@testing-library/react';

import useDragScroll from './useDragScroll';

const setup = () => {
  const container = document.createElement('div');
  const plain = document.createElement('span');
  const handle = document.createElement('span');
  handle.dataset.noDragScroll = '';
  container.append(plain, handle);
  document.body.append(container);
  container.scrollLeft = 0;
  renderHook(() => useDragScroll(container));
  return { container, plain, handle };
};

// jsdom has no layout, so scrollLeft is stored as assigned without clamping.
const dragFrom = (target) => {
  fireEvent.mouseDown(target, { button: 0, clientX: 200, clientY: 0 });
  fireEvent.mouseMove(document, { clientX: 150, clientY: 0 });
  fireEvent.mouseUp(document);
};

describe('useDragScroll', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('scrolls the container when dragging from its content', () => {
    const { container, plain } = setup();
    dragFrom(plain);
    expect(container.scrollLeft).toBe(50);
  });

  it('leaves the container alone when the drag starts on a [data-no-drag-scroll] element', () => {
    const { container, handle } = setup();
    dragFrom(handle);
    expect(container.scrollLeft).toBe(0);
  });
});
