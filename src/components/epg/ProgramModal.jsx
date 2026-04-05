/**
 * Program detail modal
 * Displays detailed information about a selected program
 *
 * @param {Object} props - Component props
 * @param {string|null} props.programId - Selected program ID or null
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {React.ReactElement} Program detail dialog
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Skeleton,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import useProgramDetail from '@/hooks/useProgramDetail';
import { formatTime, formatDate, formatDuration } from '@/utils/time';
import { getLargeImageUrl } from '@/utils/images';

/**
 * Render cast members grouped by role
 * @param {Object} props - Component props
 * @param {Array} props.cast - Array of cast members
 * @returns {React.ReactElement|null} Cast section
 */
const CastSection = ({ cast }) => {
  if (!cast || cast.length === 0) {
    return null;
  }

  const grouped = {};
  for (const member of cast) {
    const job = member.job ?? 'Autre';
    if (!grouped[job]) {
      grouped[job] = [];
    }
    const name = [member.first_name, member.last_name].filter(Boolean).join(' ');
    const display = member.role ? `${name} (${member.role})` : name;
    grouped[job].push(display);
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

const ProgramModalContent = ({ program, isLoading }) => {
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

  const imageUrl = getLargeImageUrl(program.picture_big);
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
            width: '100%',
            maxHeight: 200,
            objectFit: 'cover',
            borderRadius: 1,
            mb: 2,
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
    </>
  );
};

const ProgramModal = ({ programId, onClose }) => {
  const { program, isLoading } = useProgramDetail(programId);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isOpen = Boolean(programId);

  if (isMobile) {
    return (
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
          <ProgramModalContent program={program} isLoading={isLoading} />
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1, mr: 1 }}>
          {program?.title ?? ''}
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Fermer">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <ProgramModalContent program={program} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
};

export default ProgramModal;
