import { renderHook, act } from '@testing-library/react';

import useElementSize from './useElementSize';

const makeNode = (width, height) => {
  const node = document.createElement('div');
  const size = { width, height };
  Object.defineProperty(node, 'clientWidth', { configurable: true, get: () => size.width });
  Object.defineProperty(node, 'clientHeight', { configurable: true, get: () => size.height });
  node.resize = (newWidth, newHeight) => Object.assign(size, { width: newWidth, height: newHeight });
  return node;
};

describe('useElementSize', () => {
  let observers;

  beforeEach(() => {
    observers = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect = vi.fn();

        constructor(onResize) {
          this.onResize = onResize;
          observers.push(this);
        }

        observe(node) {
          this.node = node;
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns zero size without a node', () => {
    const { result } = renderHook(() => useElementSize(null));
    expect(result.current).toStrictEqual({ width: 0, height: 0 });
  });

  it('measures the node on mount', () => {
    const node = makeNode(800, 600);
    const { result } = renderHook(() => useElementSize(node));
    expect(result.current).toStrictEqual({ width: 800, height: 600 });
    expect(observers[0].node).toBe(node);
  });

  it('updates when the node is resized without a re-render', () => {
    const node = makeNode(800, 600);
    const { result } = renderHook(() => useElementSize(node));

    node.resize(1200, 900);
    act(() => observers[0].onResize());

    expect(result.current).toStrictEqual({ width: 1200, height: 900 });
  });

  it('disconnects the observer on unmount', () => {
    const node = makeNode(800, 600);
    const { unmount } = renderHook(() => useElementSize(node));
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalledWith();
  });
});
