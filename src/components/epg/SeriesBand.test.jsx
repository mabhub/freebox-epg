import { fireEvent, render } from '@testing-library/react';
import { CELL_GAP_PX } from '@/utils/constants';
import { groupConsecutiveEpisodes } from '@/utils/programs';
import SeriesBand from './SeriesBand';

const at = (minutes) => 1_700_000_000 + minutes * 60;
const ep = (id, start, subTitle) => ({ id, title: 'Phinéas', date: at(start), duration: 600, sub_title: subTitle });
const GROUP = groupConsecutiveEpisodes([ep('a', 0, 'La belle'), ep('b', 10, 'La terrifiante')])[0];

/**
 * Render the band of GROUP at 4 px per minute, grid starting at its first episode.
 * @param {number} now - Current time (unix seconds)
 * @param {Function} [onRecord] - Record callback
 * @returns {import('@testing-library/react').RenderResult} Render result
 */
const renderBand = (now, onRecord = vi.fn()) =>
  render(
    <SeriesBand group={GROUP} timeOrigin={at(0)} pixelsPerMinute={4} sidebarWidth={0} now={now} onRecord={onRecord} />,
  );

describe('SeriesBand', () => {
  it('labels the band with the show title and episode count', () => {
    expect(renderBand(at(-5)).getByText('Phinéas · 2 épisodes')).toBeInTheDocument();
  });

  it('spans from the first episode start to the last episode end', () => {
    const band = renderBand(at(-5)).container.firstChild;
    expect(band.style.left).toBe('0px');
    expect(band.style.width).toBe(`${20 * 4 - CELL_GAP_PX}px`);
  });

  it('opens the recording of the whole group on click', () => {
    const onRecord = vi.fn();
    const band = renderBand(at(-5), onRecord).container.firstChild;
    expect(band).toHaveAttribute('title', 'Enregistrer les épisodes');
    fireEvent.click(band);
    expect(onRecord).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a', duration: 1200, sub_title: 'La belle (+1 épisodes)' }),
    );
  });

  it('records from the episode on air', () => {
    const onRecord = vi.fn();
    fireEvent.click(renderBand(at(12), onRecord).container.firstChild);
    expect(onRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 'b', duration: 600 }));
  });

  it('does nothing on click once the group is over', () => {
    const onRecord = vi.fn();
    const band = renderBand(at(25), onRecord).container.firstChild;
    expect(band).not.toHaveAttribute('title');
    fireEvent.click(band);
    expect(onRecord).not.toHaveBeenCalled();
  });
});
