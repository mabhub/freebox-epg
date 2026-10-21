import { render, screen } from '@testing-library/react';

import { transformRecording } from '@/api/transformers';
import { formatTime } from '@/utils/time';
import RecordingTooltip from './RecordingTooltip';

const raw = {
  id: 1,
  channel_name: 'TF1',
  name: 'Tracker',
  start: 1_800_000_000,
  end: 1_800_009_000,
  state: 'waiting_start_time',
};

describe('RecordingTooltip', () => {
  it('shows the program slot and its margins apart', () => {
    const recording = transformRecording({ ...raw, margin_before: 300, margin_after: 900 }, 'programmed');
    render(<RecordingTooltip recording={recording} />);

    expect(
      screen.getByText(`TF1 • ${formatTime(raw.start)} - ${formatTime(raw.end)} • 2h30 • marges +5 / +15 min`),
    ).toBeInTheDocument();
  });

  it('omits the margins when there are none', () => {
    const recording = transformRecording(raw, 'programmed');
    render(<RecordingTooltip recording={recording} />);

    expect(screen.getByText(`TF1 • ${formatTime(raw.start)} - ${formatTime(raw.end)} • 2h30`)).toBeInTheDocument();
  });
});
