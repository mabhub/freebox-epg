import { render } from '@testing-library/react';
import useFreeboxImage from '@/hooks/useFreeboxImage';
import { SERIES_BAND_HEIGHT } from '@/utils/constants';
import ProgramCell from './ProgramCell';

vi.mock('@/hooks/useFreeboxImage', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useProgramDetail', () => ({ usePrefetchProgram: () => vi.fn() }));

const PROGRAM = { id: 'p', title: 'Titre', date: 0, duration: 3600, picture: '/api/latest/tv/img/p.jpg' };

/**
 * Render a cell wide enough to show a thumbnail.
 * @param {Object} [program] - Program to render
 * @param {Object} [props] - Extra props
 * @returns {import('@testing-library/react').RenderResult} Render result
 */
const renderCellResult = (program = PROGRAM, props = {}) =>
  render(
    <ProgramCell
      program={program}
      timeOrigin={0}
      pixelsPerMinute={4}
      sidebarWidth={0}
      channelUuid="uuid-1"
      isOnAir={false}
      onSelect={() => {}}
      {...props}
    />,
  );

/**
 * Render a cell wide enough to show a thumbnail.
 * @param {Object} [program] - Program to render
 * @param {Object} [props] - Extra props
 * @returns {HTMLElement} Render container
 */
const renderCell = (program = PROGRAM, props = {}) => renderCellResult(program, props).container;

describe('ProgramCell thumbnail', () => {
  it('holds the thumbnail space with a pulsing placeholder while loading', () => {
    useFreeboxImage.mockReturnValue({ src: null, failed: false });
    const container = renderCell();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.MuiSkeleton-root')).toHaveClass('MuiSkeleton-pulse');
  });

  it('keeps a still placeholder when the thumbnail fails', () => {
    useFreeboxImage.mockReturnValue({ src: null, failed: true });
    const placeholder = renderCell().querySelector('.MuiSkeleton-root');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).not.toHaveClass('MuiSkeleton-pulse');
  });

  it('shows the thumbnail once loaded', () => {
    useFreeboxImage.mockReturnValue({ src: 'blob:1', failed: false });
    const container = renderCell();
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:1');
    expect(container.querySelector('.MuiSkeleton-root')).toBeNull();
  });

  it('reserves no space for a program without picture', () => {
    useFreeboxImage.mockReturnValue({ src: null, failed: false });
    const container = renderCell({ ...PROGRAM, picture: undefined });
    expect(container.querySelector('.MuiSkeleton-root')).toBeNull();
  });
});

describe('ProgramCell in an episode group', () => {
  const EPISODE = { ...PROGRAM, sub_title: 'La belle', season_number: 2, episode_number: 3 };

  beforeEach(() => {
    useFreeboxImage.mockReturnValue({ src: null, failed: false });
  });

  it('hides the show title and shows subtitle then season/episode', () => {
    const { getByText, queryByText } = renderCellResult(EPISODE, { groupTitle: 'Titre' });
    expect(queryByText('Titre')).toBeNull();
    expect(getByText('La belle')).toBeInTheDocument();
    expect(getByText('S2E3')).toBeInTheDocument();
  });

  it('falls back to season/episode when there is no subtitle', () => {
    const { getByText, queryByText } = renderCellResult({ ...EPISODE, sub_title: undefined }, { groupTitle: 'Titre' });
    expect(queryByText('Titre')).toBeNull();
    expect(getByText('S2E3')).toBeInTheDocument();
  });

  it('keeps the title of an interlude under a band', () => {
    const { getByText } = renderCellResult({ ...PROGRAM, title: 'Météo' }, { groupTitle: 'Titre' });
    expect(getByText('Météo')).toBeInTheDocument();
  });

  it('drops the thumbnail and sits below the band', () => {
    const container = renderCell(EPISODE, { groupTitle: 'Titre' });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.MuiSkeleton-root')).toBeNull();
    expect(container.firstChild.style.top).toBe(`${SERIES_BAND_HEIGHT + 4}px`);
  });

  it('renders as before without a group', () => {
    const { container, getByText } = renderCellResult(EPISODE);
    expect(getByText('Titre')).toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(container.firstChild.style.top).toBe('');
  });
});
