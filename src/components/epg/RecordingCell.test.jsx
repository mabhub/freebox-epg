import { render, screen } from '@testing-library/react';

import { transformRecording } from '@/api/transformers';
import RecordingCell from './RecordingCell';

const rect = { left: 0, top: 0, width: 340, height: 6 };

const renderCell = (raw) =>
  render(
    <RecordingCell
      recording={transformRecording({ id: 1, name: 'Tracker', state: 'running', ...raw }, 'programmed')}
      rect={rect}
      onSelect={() => {}}
      onDelete={() => {}}
    />,
  );

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
});
