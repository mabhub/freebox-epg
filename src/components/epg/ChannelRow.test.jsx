import { fireEvent, render } from '@testing-library/react';
import useFreeboxImage from '@/hooks/useFreeboxImage';
import ChannelRow from './ChannelRow';

const at = (minutes) => 1_700_000_000 + minutes * 60;

vi.mock('./ChannelSidebar', () => ({ default: () => null }));
vi.mock('@/hooks/useFreeboxImage', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useProgramDetail', () => ({ usePrefetchProgram: () => vi.fn() }));
vi.mock('@/hooks/useCurrentTime', () => ({ default: () => 1_700_000_000 - 3600 }));

const CHANNEL = { uuid: 'uuid-1', name: 'Disney Channel' };
const show = (id, title, startMin, durationMin, subTitle) => ({
  id,
  title,
  date: at(startMin),
  duration: durationMin * 60,
  sub_title: subTitle,
});

/**
 * Render a row of programs.
 * @param {Array<Object>} programs - Channel programs, sorted by date
 * @param {Function} [onRecordGroup] - Band click callback
 * @returns {import('@testing-library/react').RenderResult} Render result
 */
const renderRow = (programs, onRecordGroup = vi.fn()) =>
  render(
    <ChannelRow
      channel={CHANNEL}
      programs={programs}
      rowIndex={0}
      timeOrigin={at(0)}
      pixelsPerMinute={4}
      sidebarWidth={0}
      isMobile={false}
      onSelectProgram={vi.fn()}
      onRecordGroup={onRecordGroup}
    />,
  );

const RUN = [
  show('a', 'Phinéas', 0, 10, 'La belle'),
  show('m', 'Météo', 10, 3),
  show('b', 'Phinéas', 13, 10, 'La terrifiante'),
  show('c', 'Green', 23, 10),
];

describe('ChannelRow series bands', () => {
  beforeEach(() => {
    useFreeboxImage.mockReturnValue({ src: null, failed: false });
  });

  it('draws one band over back-to-back episodes and lowers their cells', () => {
    const { getByText, queryAllByText } = renderRow(RUN);
    expect(getByText('Phinéas · 2 épisodes')).toBeInTheDocument();
    expect(queryAllByText('Phinéas')).toHaveLength(0);
    expect(getByText('La belle')).toBeInTheDocument();
    expect(getByText('Météo')).toBeInTheDocument();
    expect(getByText('Green')).toBeInTheDocument();
  });

  it('draws no band without consecutive episodes', () => {
    const { getByText, queryByText } = renderRow([show('a', 'Phinéas', 0, 10), show('c', 'Green', 10, 10)]);
    expect(queryByText(/épisodes/)).toBeNull();
    expect(getByText('Phinéas')).toBeInTheDocument();
  });

  it('passes the channel along when the band is clicked', () => {
    const onRecordGroup = vi.fn();
    fireEvent.click(renderRow(RUN, onRecordGroup).getByText('Phinéas · 2 épisodes'));
    expect(onRecordGroup).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), CHANNEL);
  });
});
