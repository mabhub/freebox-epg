/**
 * Hook tracking the client size of a DOM node
 * @module hooks/useElementSize
 */

import { useState, useLayoutEffect } from 'react';

const EMPTY_SIZE = Object.freeze({ width: 0, height: 0 });

/**
 * Track `clientWidth` / `clientHeight` of a node, re-measured by a
 * ResizeObserver so that a resize without breakpoint change still re-renders.
 * Pass the node held in state (callback ref), not a ref object: the hook must
 * re-run when the node mounts.
 * @param {HTMLElement|null} node - Observed element
 * @returns {{width: number, height: number}} Current client size, zero without node
 */
const useElementSize = (node) => {
  const [size, setSize] = useState(EMPTY_SIZE);

  useLayoutEffect(() => {
    if (!node) {
      setSize(EMPTY_SIZE);
      return;
    }

    const measure = () => {
      const { clientWidth: width, clientHeight: height } = node;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return size;
};

export default useElementSize;
