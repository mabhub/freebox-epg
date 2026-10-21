import { act, fireEvent, renderHook } from '@testing-library/react';

import useRecordingResizeDrag from './useRecordingResizeDrag';

const T = 1_800_000_000;

// Program slot [T+3900, T+7200], 5 min before, 15 min after.
const recording = {
  id: 7,
  kind: 'programmed',
  state: 'waiting',
  generatorId: null,
  start: T + 3600,
  end: T + 8100,
  marginBefore: 300,
  marginAfter: 900,
  raw: { id: 7, start: T + 3900, end: T + 7200, margin_before: 300, margin_after: 900 },
};

// jsdom places the overlay at x = 0, so clientX is the grid content offset.
// With a 120 px sidebar at 3 px/min from T, x = 120 + minutes * 3.
const xAt = (seconds) => 120 + (seconds / 60) * 3;

const renderDrag = ({ onCommit = vi.fn(), dataVersion = 1 } = {}) => {
  const overlayNode = document.createElement('div');
  const hook = renderHook(
    (props) =>
      useRecordingResizeDrag({
        overlayNode,
        timeOrigin: T,
        pixelsPerMinute: 3,
        sidebarWidth: 120,
        now: T,
        onCommit,
        ...props,
      }),
    { initialProps: { dataVersion } },
  );
  return { ...hook, onCommit };
};

const grabEnd = (result) => {
  act(() => {
    result.current.startResize({
      event: { button: 0, preventDefault: () => {} },
      recording,
      edge: 'end',
      snapTargets: [],
    });
  });
};

describe('useRecordingResizeDrag', () => {
  it('previews the new program slot while the pointer moves', () => {
    const { result } = renderDrag();
    grabEnd(result);

    // Real edge at T+9000 → program end T+8100.
    act(() => {
      fireEvent.mouseMove(document, { clientX: xAt(9000) });
    });

    expect(result.current.draft).toMatchObject({ recording, edge: 'end', start: T + 3900, end: T + 8100 });
  });

  it('commits the new slot once on release', () => {
    const { result, onCommit } = renderDrag();
    grabEnd(result);

    act(() => {
      fireEvent.mouseMove(document, { clientX: xAt(9000) });
      fireEvent.mouseUp(document);
    });
    act(() => {
      fireEvent.mouseMove(document, { clientX: xAt(12_000) });
      fireEvent.mouseUp(document);
    });

    expect(onCommit).toHaveBeenCalledExactlyOnceWith(recording, { start: T + 3900, end: T + 8100 });
  });

  it('drops the preview without saving when the slot did not change', () => {
    const { result, onCommit } = renderDrag();
    grabEnd(result);

    act(() => {
      fireEvent.mouseUp(document);
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.draft).toBeNull();
  });

  it('keeps a committed preview until the recordings change', () => {
    const { result, rerender } = renderDrag();
    grabEnd(result);
    act(() => {
      fireEvent.mouseMove(document, { clientX: xAt(9000) });
      fireEvent.mouseUp(document);
    });

    expect(result.current.draft).toMatchObject({ end: T + 8100 });

    rerender({ dataVersion: 2 });

    expect(result.current.draft).toBeNull();
  });

  it('swallows the click that follows the release', () => {
    const { result } = renderDrag();
    const onClick = vi.fn();
    const button = document.createElement('button');
    button.addEventListener('click', onClick);
    document.body.append(button);
    grabEnd(result);

    act(() => {
      fireEvent.mouseMove(document, { clientX: xAt(9000) });
      fireEvent.mouseUp(document);
    });
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    button.remove();
  });
});
