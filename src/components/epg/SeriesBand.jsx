/**
 * Band at the top of a channel row spanning back-to-back episodes of a show.
 * A click opens the recording of the episodes not over yet, as one
 * recording; once they are all over the band only labels the run.
 *
 * @param {Object} props - Component props
 * @param {import('@/utils/programs').EpisodeGroup} props.group - Episodes the band spans
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.sidebarWidth - Width of the channel sidebar
 * @param {number} props.now - Current time (unix seconds)
 * @param {Function} props.onRecord - Called with the program spanning the episodes to record
 * @returns {React.ReactElement} Series band
 */

import { memo } from 'react';
import { Typography, styled } from '@mui/material';
import { getCategoryAccent, getCategoryColor } from '@/utils/categories';
import { CELL_GAP_PX, SERIES_BAND_HEIGHT } from '@/utils/constants';
import { recordableGroupProgram } from '@/utils/programs';

const BandRoot = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 2,
  height: SERIES_BAND_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${theme.spacing(0.5)}`,
  borderRadius: theme.shape.borderRadius,
  // clip, not hidden: hidden would make the band a scroll container and
  // break the sticky label.
  overflow: 'clip',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  opacity: 0.55,
  transition: 'background-color 0.15s',
}));

const Label = styled('div')({
  position: 'sticky',
  minWidth: 0,
  maxWidth: '100%',
});

const SeriesBand = memo(({ group, timeOrigin, pixelsPerMinute, sidebarWidth, now, onRecord }) => {
  const [first] = group.episodes;
  const categoryBg = getCategoryColor(first.category);
  const categoryAccent = getCategoryAccent(first.category);
  const recordable = recordableGroupProgram(group, now);
  const isOnAir = group.date <= now && now < group.end;

  return (
    <BandRoot
      title={recordable ? 'Enregistrer les épisodes' : undefined}
      onClick={recordable ? () => onRecord(recordable) : undefined}
      style={{
        left: sidebarWidth + ((group.date - timeOrigin) / 60) * pixelsPerMinute,
        width: Math.max(0, ((group.end - group.date) / 60) * pixelsPerMinute - CELL_GAP_PX),
        cursor: recordable ? 'pointer' : 'default',
        ...(categoryBg && { backgroundColor: categoryBg }),
        ...(isOnAir && { opacity: 1 }),
        ...(categoryAccent && { borderLeft: `3px solid ${categoryAccent}` }),
      }}
    >
      <Label style={{ left: sidebarWidth }}>
        <Typography variant="caption" fontWeight="bold" noWrap sx={{ display: 'block', lineHeight: 1.2 }}>
          {`${group.title} · ${group.episodes.length} épisodes`}
        </Typography>
      </Label>
    </BandRoot>
  );
});

SeriesBand.displayName = 'SeriesBand';

export default SeriesBand;
