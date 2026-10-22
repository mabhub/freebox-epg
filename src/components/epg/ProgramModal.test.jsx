import { render, screen, fireEvent } from '@testing-library/react';

import { formatTime } from '@/utils/time';
import useFreeboxImage from '@/hooks/useFreeboxImage';
import ProgramModal from './ProgramModal';

const PROGRAMS = [
  { id: 'a', date: 1000, duration: 600 },
  { id: 'b', date: 1600, duration: 600 },
  { id: 'c', date: 2200, duration: 600 },
];

let programPicture;
vi.mock('@/hooks/useProgramDetail', () => ({
  default: (programId) => ({
    program: { id: programId, title: `Programme ${programId}`, date: 1600, duration: 600, picture_big: programPicture },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useRecordingsByChannel', () => ({
  default: () => new Map(),
}));

vi.mock('@/hooks/useFreeboxImage', () => ({ default: vi.fn() }));

vi.mock('@/hooks/useCurrentTime', () => ({
  default: () => 0,
}));

let followingEpisodes = [];
let episodesLoading = false;
vi.mock('@/hooks/useFollowingEpisodes', () => ({
  default: () => ({ episodes: followingEpisodes, isLoading: episodesLoading }),
}));

vi.mock('./RecordModal', () => ({
  default: ({ program }) => (
    <div role="dialog" aria-label="record-modal">
      <input aria-label="Début" />
      <p>{`${program.sub_title ?? ''} jusqu'à ${program.date + program.duration}`}</p>
    </div>
  ),
}));

beforeEach(() => {
  followingEpisodes = [];
  episodesLoading = false;
  programPicture = undefined;
  useFreeboxImage.mockReturnValue({ src: null, failed: false });
});

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

describe('recording the following episodes', () => {
  const NEXT = [
    { id: 'x', title: 'Programme b', date: 2200, duration: 600 },
    { id: 'y', title: 'Programme b', date: 2800, duration: 900 },
  ];
  const MENU = 'Enregistrer aussi les épisodes suivants';

  it('offers no episode menu when no episode follows', () => {
    renderModal(() => {});
    expect(screen.queryByRole('button', { name: MENU })).toBeNull();
  });

  it('waits for the following episodes before showing the record button, which would change shape', () => {
    episodesLoading = true;
    renderModal(() => {});
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull();
  });

  it('lists one entry per extra episode with the time it ends', () => {
    followingEpisodes = NEXT;
    renderModal(() => {});

    fireEvent.click(screen.getByRole('button', { name: MENU }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toStrictEqual([
      `+1 épisode · jusqu'à ${formatTime(2800)}`,
      `+2 épisodes · jusqu'à ${formatTime(3700)}`,
    ]);
  });

  it('opens the record modal stretched over the chosen episodes', () => {
    followingEpisodes = NEXT;
    renderModal(() => {});

    fireEvent.click(screen.getByRole('button', { name: MENU }));
    fireEvent.click(screen.getAllByRole('menuitem')[1]);

    expect(screen.getByText("(+2 épisodes) jusqu'à 3700")).toBeInTheDocument();
  });

  it('keeps the main button for the program alone', () => {
    followingEpisodes = NEXT;
    renderModal(() => {});

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(screen.getByText("jusqu'à 2200", { exact: false })).toBeInTheDocument();
  });
});

describe('picture in ProgramModal', () => {
  it('holds the picture space with a pulsing placeholder while loading', () => {
    programPicture = '/api/latest/tv/img/b.jpg';
    renderModal(() => {});
    expect(screen.queryByRole('img', { name: 'Programme b' })).toBeNull();
    expect(document.querySelector('.MuiSkeleton-root')).toHaveClass('MuiSkeleton-pulse');
  });

  it('keeps a still placeholder when the picture fails', () => {
    programPicture = '/api/latest/tv/img/b.jpg';
    useFreeboxImage.mockReturnValue({ src: null, failed: true });
    renderModal(() => {});
    const placeholder = document.querySelector('.MuiSkeleton-root');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).not.toHaveClass('MuiSkeleton-pulse');
  });

  it('shows the picture once loaded', () => {
    programPicture = '/api/latest/tv/img/b.jpg';
    useFreeboxImage.mockReturnValue({ src: 'blob:1', failed: false });
    renderModal(() => {});
    expect(screen.getByRole('img', { name: 'Programme b' })).toHaveAttribute('src', 'blob:1');
    expect(document.querySelector('.MuiSkeleton-root')).toBeNull();
  });

  it('reserves no space for a program without picture', () => {
    renderModal(() => {});
    expect(document.querySelector('.MuiSkeleton-root')).toBeNull();
  });
});
