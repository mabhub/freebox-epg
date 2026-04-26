/**
 * Form fields for the recording modal: name, subname, start, end, quality,
 * media, path. The JSX-heavy markup is split out of RecordModal so that
 * file stays under the project's complexity budget while sharing the same
 * field-locking matrix between create and edit modes.
 *
 * @param {Object} props - Component props
 * @param {Object} props.values - Form values from useRecordingForm
 * @param {Function} props.setField - Field setter from useRecordingForm
 * @param {Object} props.locks - Lock matrix from useRecordingForm
 * @param {number} props.duration - Duration in seconds (display-only)
 * @param {Array|null|undefined} props.mediaList - Available media options
 * @returns {React.ReactElement} Field group
 */

import { MenuItem, TextField, Typography } from '@mui/material';
import { formatDuration } from '@/utils/time';

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'hd', label: 'HD' },
  { value: 'sd', label: 'SD' },
  { value: 'ld', label: 'LD' },
];

const formatBytes = (bytes) => `${(bytes / (1024 ** 3)).toFixed(1)} Go`;

const RecordingFormFields = ({ values, setField, locks, duration, mediaList }) => (
  <>
    <TextField label="Nom" value={values.name} onChange={setField('name')} fullWidth required size="small" disabled={!locks.name} />
    <TextField label="Sous-titre" value={values.subname} onChange={setField('subname')} fullWidth size="small" disabled={!locks.subname} />

    <TextField
      label="Début" type="datetime-local" value={values.start} onChange={setField('start')}
      fullWidth required size="small" disabled={!locks.start}
      slotProps={{ inputLabel: { shrink: true } }}
    />
    <TextField
      label="Fin" type="datetime-local" value={values.end} onChange={setField('end')}
      fullWidth required size="small" disabled={!locks.end}
      slotProps={{ inputLabel: { shrink: true } }}
    />

    {duration > 0 && (
      <Typography variant="caption" color="text.secondary">
        Durée : {formatDuration(duration)}
      </Typography>
    )}

    <TextField label="Qualité" value={values.quality} onChange={setField('quality')} select fullWidth size="small" disabled={!locks.quality}>
      {QUALITY_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
      ))}
    </TextField>

    {mediaList?.length > 0 && (
      <TextField label="Support" value={values.media} onChange={setField('media')} select fullWidth size="small" disabled={!locks.media}>
        {mediaList.map((m) => (
          <MenuItem key={m.media} value={m.media}>
            {m.media} ({formatBytes(m.free_bytes)} libres)
          </MenuItem>
        ))}
      </TextField>
    )}

    <TextField label="Dossier" value={values.path} onChange={setField('path')} fullWidth size="small" disabled={!locks.path} />
  </>
);

export default RecordingFormFields;
