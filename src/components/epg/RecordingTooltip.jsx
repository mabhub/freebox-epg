/**
 * Tooltip content shown when hovering a recording overlay cell. The time
 * line gives the program slot, followed by the margins when there are any.
 *
 * @param {Object} props - Component props
 * @param {Object} props.recording - Unified recording (see transformers.js)
 * @returns {React.ReactElement} Tooltip body
 */

import { Box, Chip, Typography } from '@mui/material';
import { formatTime, formatDuration } from '@/utils/time';
import { RECORDING_STATE_LABELS } from '@/utils/recordingStates';

const QUALITY_LABELS = {
  auto: 'Auto',
  hd: 'HD',
  sd: 'SD',
  ld: 'LD',
  '3d': '3D',
};

const formatMargins = (marginBefore, marginAfter) =>
  marginBefore > 0 || marginAfter > 0 ? ` • marges +${marginBefore / 60} / +${marginAfter / 60} min` : '';

const RecordingTooltip = ({ recording }) => {
  const { name, subname, channelName, start, end, marginBefore, marginAfter, state, generatorId, raw } = recording;
  const slotStart = start + marginBefore;
  const slotEnd = end - marginAfter;
  const stateLabel = RECORDING_STATE_LABELS[state] ?? state;
  const error = raw?.error && raw.error !== 'none' ? raw.error : null;
  const quality = raw?.channel_quality ? (QUALITY_LABELS[raw.channel_quality] ?? raw.channel_quality) : null;

  return (
    <Box sx={{ maxWidth: 300 }}>
      <Typography variant="caption" color="text.secondary">
        {channelName} &bull; {formatTime(slotStart)} - {formatTime(slotEnd)} &bull;{' '}
        {formatDuration(slotEnd - slotStart)}
        {formatMargins(marginBefore, marginAfter)}
      </Typography>
      <Typography variant="body2" fontWeight="bold">
        {name}
      </Typography>
      {subname && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {subname}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
        <Chip size="small" label={stateLabel} variant="outlined" />
        {quality && <Chip size="small" label={quality} variant="outlined" />}
        {generatorId !== null && <Chip size="small" label="Récurrent" variant="outlined" />}
      </Box>
      {state === 'failed' && error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default RecordingTooltip;
