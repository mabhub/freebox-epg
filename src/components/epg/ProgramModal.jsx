/**
 * Program detail modal
 * Displays detailed information about a selected program
 * Supports left/right arrow keys to navigate between programs on the same channel
 *
 * @param {Object} props - Component props
 * @param {string|null} props.programId - Selected program ID or null
 * @param {Array} props.channelPrograms - Programs for the selected channel (sorted by date)
 * @param {Object|null} props.selectedChannel - Channel object whose program is shown (uuid + name)
 * @param {Function} props.onNavigate - Callback with new programId for prev/next navigation
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {React.ReactElement} Program detail dialog
 */

import { useEffect, useCallback, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Chip,
  Skeleton,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  FiberManualRecord as RecordIcon,
} from '@mui/icons-material';

import useProgramDetail from '@/hooks/useProgramDetail';
import useRecordingsByChannel from '@/hooks/useRecordingsByChannel';
import useCurrentTime from '@/hooks/useCurrentTime';
import { findRecordingCoveringProgram } from '@/utils/recordingPosition';
import RecordModal from './RecordModal';
import { formatTime, formatDate, formatDuration } from '@/utils/time';

/**
 * Render cast members grouped by role
 * @param {Object} props - Component props
 * @param {Array} props.cast - Array of cast members
 * @returns {React.ReactElement|null} Cast section
 */
const CastSection = ({ cast }) => {
  if (!Array.isArray(cast) || cast.length === 0) {
    return null;
  }

  const grouped = {};
  for (const member of cast) {
    const job = member.job ?? 'Autre';
    if (!grouped[job]) {
      grouped[job] = [];
    }
    const name = [member.first_name, member.last_name].filter(Boolean).join(' ');
    if (name) {
      const display = member.role ? `${name} (${member.role})` : name;
      grouped[job].push(display);
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      {Object.entries(grouped).map(([job, names]) => (
        <Box key={job} sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {job}
          </Typography>
          <Typography variant="body2">
            {names.join(', ')}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const RecordingActionButton = ({ coveringRecording, programIsOver, onRecord, onEditRecording }) => {
  if (coveringRecording) {
    return (
      <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<EditIcon />}
        onClick={() => onEditRecording(coveringRecording)}
      >
        Modifier l&apos;enregistrement
      </Button>
    );
  }
  if (programIsOver) {
    return null;
  }
  return (
    <Button
      variant="contained"
      color="error"
      size="small"
      startIcon={<RecordIcon />}
      onClick={onRecord}
    >
      Enregistrer
    </Button>
  );
};

const ProgramModalContent = ({
  program,
  isLoading,
  coveringRecording,
  programIsOver,
  onRecord,
  onEditRecording,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={130} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="80%" />
      </Box>
    );
  }

  if (!program) {
    return null;
  }

  const imageUrl = program.picture_big ?? null;
  const startTime = formatTime(program.date);
  const endTime = formatTime(program.date + program.duration);
  const date = formatDate(program.date);
  const duration = formatDuration(program.duration);

  return (
    <>
      {imageUrl && (
        <Box
          component="img"
          src={imageUrl}
          alt={program.title}
          sx={{
            float: 'right',
            width: 168,
            height: 130,
            borderRadius: 1,
            ml: 2,
            mb: 1,
          }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        {program.category_name && (
          <Chip label={program.category_name} size="small" color="primary" />
        )}
        {program.year && (
          <Chip label={String(program.year)} size="small" variant="outlined" />
        )}
        {program.season_number && (
          <Chip
            label={`S${program.season_number}E${program.episode_number ?? '?'}`}
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {date} &bull; {startTime} - {endTime} ({duration})
      </Typography>

      {program.sub_title && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {program.sub_title}
        </Typography>
      )}

      {(program.desc ?? program.short_desc) && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {program.desc ?? program.short_desc}
        </Typography>
      )}

      <CastSection cast={program.cast} />

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <RecordingActionButton
          coveringRecording={coveringRecording}
          programIsOver={programIsOver}
          onRecord={onRecord}
          onEditRecording={onEditRecording}
        />
      </Box>
    </>
  );
};

const ProgramModal = ({ programId, channelPrograms, selectedChannel, onNavigate, onClose }) => {
  const { program, isLoading } = useProgramDetail(programId);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isOpen = Boolean(programId);
  const [recordOpen, setRecordOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState(null);
  const channelUuid = selectedChannel?.uuid ?? '';
  const channelName = selectedChannel?.name ?? '';

  const recordingsByChannel = useRecordingsByChannel();
  const now = useCurrentTime();
  const coveringRecording = program
    ? findRecordingCoveringProgram(recordingsByChannel.get(channelUuid), program)
    : null;
  const programIsOver = program ? program.date + program.duration <= now : false;

  const handleKeyDown = useCallback((event) => {
    if (!programId || !channelPrograms?.length) {
      return;
    }
    const currentIndex = channelPrograms.findIndex((p) => p.id === programId);
    if (currentIndex === -1) {
      return;
    }

    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      event.stopPropagation();
      onNavigate(channelPrograms[currentIndex - 1].id);
    } else if (event.key === 'ArrowRight' && currentIndex < channelPrograms.length - 1) {
      event.stopPropagation();
      onNavigate(channelPrograms[currentIndex + 1].id);
    }
  }, [programId, channelPrograms, onNavigate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const recordModal = recordOpen && (
    <RecordModal
      open
      onClose={() => setRecordOpen(false)}
      program={program}
      channelUuid={channelUuid}
      channelName={channelName}
    />
  );

  const editRecordingModal = editingRecording && (
    <RecordModal
      open
      onClose={() => setEditingRecording(null)}
      recording={editingRecording}
    />
  );

  const content = (
    <ProgramModalContent
      program={program}
      isLoading={isLoading}
      coveringRecording={coveringRecording}
      programIsOver={programIsOver}
      onRecord={() => setRecordOpen(true)}
      onEditRecording={setEditingRecording}
    />
  );

  if (isMobile) {
    return (
      <>
        <Drawer
          anchor="bottom"
          open={isOpen}
          onClose={onClose}
          slotProps={{
            paper: {
              sx: { maxHeight: '80vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, mr: 1 }}>
              {program?.title ?? ''}
            </Typography>
            <IconButton onClick={onClose} size="small" aria-label="Fermer">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 2, overflowY: 'auto' }}>
            {content}
          </Box>
        </Drawer>
        {recordModal}
        {editRecordingModal}
      </>
    );
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {program?.title ?? ''}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Fermer">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {content}
        </DialogContent>
      </Dialog>
      {recordModal}
      {editRecordingModal}
    </>
  );
};

export default ProgramModal;
