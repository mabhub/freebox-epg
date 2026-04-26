/**
 * Single recording cell rendered inside RecordingsOverlay. Displays a state
 * icon, the recording name, and a hover-only delete button on desktop.
 *
 * @param {Object} props - Component props
 * @param {Object} props.recording - Unified recording (see transformers.js)
 * @param {{ left: number, top: number, width: number, height: number }} props.rect - Pre-computed rect
 * @param {Function} props.onSelect - Callback when the cell is clicked (opens edit modal)
 * @param {Function} props.onDelete - Callback for inline deletion
 * @returns {React.ReactElement} Recording cell
 */

import { memo, useCallback, useMemo } from 'react';
import { IconButton, Tooltip, styled, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { OVERLAY_BORDER_LEFT_PX, OVERLAY_MIN_WIDTH_PX } from '@/utils/constants';
import { getRecordingStateColor, RECORDING_STATE_LABELS } from '@/utils/recordingStates';
import RecordingTooltip from './RecordingTooltip';

const NAME_MIN_WIDTH = 60;

const CellRoot = styled('button')(({ theme }) => ({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.25),
  margin: 0,
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.08)',
  cursor: 'pointer',
  overflow: 'hidden',
  fontSize: '0.7rem',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.16)',
    '& .recording-cell__delete': {
      opacity: 1,
    },
  },
}));

const Name = styled('span')({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const RUNNING_PULSE_KEYFRAMES = {
  '@keyframes recording-pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.45 },
  },
};

const TOOLTIP_SLOT_PROPS = {
  tooltip: {
    sx: {
      bgcolor: 'background.paper',
      color: 'text.primary',
      boxShadow: 4,
      border: 1,
      borderColor: 'divider',
      '& .MuiTooltip-arrow': { color: 'background.paper' },
    },
  },
};

const STATE_ICONS = {
  running: FiberManualRecordIcon,
  failed: WarningAmberIcon,
  disabled: BlockIcon,
  finished: CheckCircleOutlineIcon,
  waiting: HourglassEmptyIcon,
};

const StateIcon = ({ state, color }) => {
  const Icon = STATE_ICONS[state] ?? HourglassEmptyIcon;
  const baseSx = { fontSize: '0.85rem', color, flexShrink: 0 };
  if (state === 'running') {
    return (
      <Icon
        sx={{ ...baseSx, ...RUNNING_PULSE_KEYFRAMES, animation: 'recording-pulse 1.6s ease-in-out infinite' }}
      />
    );
  }
  return <Icon sx={baseSx} />;
};

const RecordingCell = memo(({ recording, rect, onSelect, onDelete }) => {
  const theme = useTheme();
  const supportsHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const stateColor = getRecordingStateColor(theme, recording.state);
  const stateLabel = RECORDING_STATE_LABELS[recording.state] ?? recording.state;

  const handleClick = useCallback(() => {
    onSelect(recording);
  }, [onSelect, recording]);

  const handleDelete = useCallback(
    (event) => {
      event.stopPropagation();
      onDelete(recording);
    },
    [onDelete, recording],
  );

  const tooltipContent = useMemo(() => <RecordingTooltip recording={recording} />, [recording]);

  const showName = rect.width >= NAME_MIN_WIDTH;

  return (
    <Tooltip
      title={tooltipContent}
      placement="top"
      arrow
      enterDelay={250}
      disableInteractive
      slotProps={TOOLTIP_SLOT_PROPS}
    >
      <CellRoot
        type="button"
        aria-label={`${recording.name} — ${stateLabel}`}
        onClick={handleClick}
        style={{
          left: rect.left,
          top: rect.top,
          width: Math.max(OVERLAY_MIN_WIDTH_PX, rect.width),
          height: rect.height,
          borderLeft: `${OVERLAY_BORDER_LEFT_PX}px solid ${stateColor}`,
        }}
      >
        <StateIcon state={recording.state} color={stateColor} />
        {showName && <Name>{recording.name}</Name>}
        {supportsHover && (
          <IconButton
            className="recording-cell__delete"
            size="small"
            onClick={handleDelete}
            sx={{
              opacity: 0,
              padding: 0,
              transition: 'opacity 0.15s',
              flexShrink: 0,
            }}
            aria-label="Supprimer l'enregistrement"
          >
            <DeleteOutlineIcon sx={{ fontSize: '0.85rem' }} />
          </IconButton>
        )}
      </CellRoot>
    </Tooltip>
  );
});

RecordingCell.displayName = 'RecordingCell';

export default RecordingCell;
