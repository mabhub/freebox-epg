import { render, screen, fireEvent } from '@testing-library/react';

import ProgramModal from './ProgramModal';

const PROGRAMS = [
  { id: 'a', date: 1000, duration: 600 },
  { id: 'b', date: 1600, duration: 600 },
  { id: 'c', date: 2200, duration: 600 },
];

vi.mock('@/hooks/useProgramDetail', () => ({
  default: (programId) => ({
    program: { id: programId, title: `Programme ${programId}`, date: 1600, duration: 600 },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useRecordingsByChannel', () => ({
  default: () => new Map(),
}));

vi.mock('@/hooks/useCurrentTime', () => ({
  default: () => 0,
}));

vi.mock('./RecordModal', () => ({
  default: () => (
    <div role="dialog" aria-label="record-modal">
      <input aria-label="Début" />
    </div>
  ),
}));

const renderModal = (onNavigate) =>
  render(
    <ProgramModal
      programId="b"
      channelPrograms={PROGRAMS}
      selectedChannel={{ uuid: 'uuid-1', name: 'Chaîne' }}
      onNavigate={onNavigate}
      onClose={() => {}}
    />,
  );

describe('arrow navigation in ProgramModal', () => {
  it('navigates to the previous and next programs', () => {
    const onNavigate = vi.fn();
    renderModal(onNavigate);

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(onNavigate.mock.calls).toStrictEqual([['a'], ['c']]);
  });

  it('ignores arrows while the record modal is open', () => {
    const onNavigate = vi.fn();
    renderModal(onNavigate);

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    fireEvent.keyDown(screen.getByLabelText('Début'), { key: 'ArrowLeft' });

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
