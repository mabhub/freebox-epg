import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { transformRecording } from '@/api/transformers';
import RecordingCell from './RecordingCell';

const rect = { left: 0, top: 0, width: 340, height: 6 };

const cellElement = (raw, { kind = 'programmed', onResizeStart = () => {}, onSelect = () => {}, isResizing } = {}) => (
  <RecordingCell
    recording={transformRecording({ id: 1, name: 'Tracker', state: 'running', ...raw }, kind)}
    rect={rect}
    onSelect={onSelect}
    onDelete={() => {}}
    onResizeStart={onResizeStart}
    isResizing={isResizing}
  />
);

const renderCell = (raw, options) => render(cellElement(raw, options));

const resizeEdges = (container) =>
  [...container.querySelectorAll('[data-resize-edge]')].map((node) => node.dataset.resizeEdge);

// MUI's useMediaQuery reads matchMedia, which jsdom lacks.
const emulatePointer = (fine) => {
  globalThis.matchMedia = (query) => ({
    matches: fine,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

describe('RecordingCell', () => {
  it('shades each margin over its share of the cell', () => {
    renderCell({ start: 3000, end: 12_000, margin_before: 300, margin_after: 900 });
    const cell = screen.getByRole('button', { name: /Tracker/ });

    expect(cell.style.getPropertyValue('--margin-before')).toBe(`${(300 / 10_200) * 100}%`);
    expect(cell.style.getPropertyValue('--margin-after')).toBe(`${(900 / 10_200) * 100}%`);
  });

  it('leaves no margin zone when the recording has none', () => {
    renderCell({ start: 3000, end: 12_000 });
    const cell = screen.getByRole('button', { name: /Tracker/ });

    expect(cell.style.getPropertyValue('--margin-before')).toBe('0%');
    expect(cell.style.getPropertyValue('--margin-after')).toBe('0%');
  });

  it('closes its open tooltip once a resize starts', async () => {
    const raw = { start: 3000, end: 12_000 };
    const { rerender } = renderCell(raw);
    fireEvent.mouseOver(screen.getByRole('button', { name: /Tracker/ }));
    await expect(screen.findByRole('tooltip')).resolves.toBeInTheDocument();

    rerender(cellElement(raw, { isResizing: true }));

    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  describe('resize handles', () => {
    beforeEach(() => emulatePointer(true));
    afterEach(() => {
      delete globalThis.matchMedia;
    });

    it('offers both edges on a waiting recording', () => {
      const { container } = renderCell({ start: 3000, end: 12_000, state: 'waiting_start_time' });
      expect(resizeEdges(container)).toStrictEqual(['start', 'end']);
    });

    it('offers only the end on a running recording', () => {
      const { container } = renderCell({ start: 3000, end: 12_000 });
      expect(resizeEdges(container)).toStrictEqual(['end']);
    });

    it('offers no edge on a finished recording', () => {
      const { container } = renderCell({ start: 3000, end: 12_000, state: 'finished' }, { kind: 'finished' });
      expect(resizeEdges(container)).toStrictEqual([]);
    });

    it('offers no edge without a fine pointer', () => {
      emulatePointer(false);
      const { container } = renderCell({ start: 3000, end: 12_000, state: 'waiting_start_time' });
      expect(resizeEdges(container)).toStrictEqual([]);
    });

    it('starts a resize from the grabbed edge without selecting the recording', () => {
      const onResizeStart = vi.fn();
      const onSelect = vi.fn();
      const { container } = renderCell(
        { start: 3000, end: 12_000, state: 'waiting_start_time' },
        { onResizeStart, onSelect },
      );

      fireEvent.mouseDown(container.querySelector('[data-resize-edge="end"]'), { button: 0 });

      expect(onResizeStart).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ type: 'mousedown' }),
        expect.objectContaining({ id: 1 }),
        'end',
      );
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('marks the handles so dragging them does not scroll the grid', () => {
      const { container } = renderCell({ start: 3000, end: 12_000, state: 'waiting_start_time' });
      const handles = [...container.querySelectorAll('[data-resize-edge]')];
      expect(handles).toHaveLength(2);
      for (const handle of handles) {
        expect(handle).toHaveAttribute('data-no-drag-scroll');
      }
    });
  });
});
