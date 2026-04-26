/**
 * Modal for scheduling a PVR recording
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Close callback
 * @param {Object|null} props.program - Program data from useProgramDetail
 * @param {string} props.channelUuid - Channel UUID
 * @param {string} props.channelName - Channel display name
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

import { usePvrConfig, usePvrMedia, useCreateRecording } from '@/hooks/usePvr';
import {
  formatDuration,
  timestampToDatetimeLocal,
  datetimeLocalToTimestamp,
} from '@/utils/time';

const DEFAULT_PATH = 'Enregistrements';
const SUCCESS_AUTO_CLOSE_MS = 1500;

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'hd', label: 'HD' },
  { value: 'sd', label: 'SD' },
  { value: 'ld', label: 'LD' },
];

/**
 * Format a byte count as a human-readable string in gigabytes
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "90.5 Go")
 */
const formatBytes = (bytes) => {
  const gb = bytes / (1024 ** 3);
  return `${gb.toFixed(1)} Go`;
};

const RecordModal = ({ open, onClose, program, channelUuid, channelName }) => {
  const { data: pvrConfig } = usePvrConfig();
  const { data: mediaList } = usePvrMedia();
  const createRecording = useCreateRecording();

  const [name, setName] = useState('');
  const [subname, setSubname] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [quality, setQuality] = useState('auto');
  const [media, setMedia] = useState('');
  const [path, setPath] = useState(DEFAULT_PATH);

  useEffect(() => {
    if (!program || !open) return;

    const marginBefore = pvrConfig?.margin_before ?? 0;
    const marginAfter = pvrConfig?.margin_after ?? 0;

    setName(program.title ?? '');
    setSubname(program.sub_title ?? '');
    setStart(timestampToDatetimeLocal(program.date - marginBefore));
    setEnd(timestampToDatetimeLocal(program.date + program.duration + marginAfter));
    setQuality('auto');
    setPath(DEFAULT_PATH);
  }, [program, pvrConfig, open]);

  useEffect(() => {
    if (open) createRecording.reset();
  }, [open, createRecording]);

  useEffect(() => {
    if (mediaList?.length && !media) {
      setMedia(mediaList[0].media);
    }
  }, [mediaList, media]);

  const startTs = start ? datetimeLocalToTimestamp(start) : 0;
  const endTs = end ? datetimeLocalToTimestamp(end) : 0;
  const duration = endTs - startTs;

  const handleSubmit = (event) => {
    event.preventDefault();
    createRecording.mutate({
      channel_uuid: channelUuid,
      channel_name: channelName,
      channel_quality: quality,
      broadcast_type: 'tv',
      name,
      subname,
      start: startTs,
      end: endTs,
      media,
      path,
      enabled: true,
    });
  };

  useEffect(() => {
    if (createRecording.isSuccess) {
      const timer = setTimeout(onClose, SUCCESS_AUTO_CLOSE_MS);
      return () => clearTimeout(timer);
    }
  }, [createRecording.isSuccess, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Programmer un enregistrement</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
          />

          <TextField
            label="Sous-titre"
            value={subname}
            onChange={(e) => setSubname(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Début"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            fullWidth
            required
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Fin"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            fullWidth
            required
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {duration > 0 && (
            <Typography variant="caption" color="text.secondary">
              Durée : {formatDuration(duration)}
            </Typography>
          )}

          <TextField
            label="Qualité"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            select
            fullWidth
            size="small"
          >
            {QUALITY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>

          {mediaList?.length > 0 && (
            <TextField
              label="Support"
              value={media}
              onChange={(e) => setMedia(e.target.value)}
              select
              fullWidth
              size="small"
            >
              {mediaList.map((m) => (
                <MenuItem key={m.media} value={m.media}>
                  {m.media} ({formatBytes(m.free_bytes)} libres)
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label="Dossier"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            fullWidth
            size="small"
          />

          {createRecording.isSuccess && (
            <Alert severity="success">Enregistrement programmé</Alert>
          )}

          {createRecording.isError && (
            <Alert severity="error">
              {createRecording.error?.message ?? 'Erreur lors de la programmation'}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createRecording.isPending || createRecording.isSuccess || !name || !start || !end || duration <= 0}
          >
            {createRecording.isPending ? <CircularProgress size={20} /> : 'Programmer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RecordModal;
