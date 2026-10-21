/**
 * Form fields for the recording modal: name, subname, program slot, margins,
 * quality, media, path. The JSX-heavy markup is split out of RecordModal so
 * that file stays under the project's complexity budget while sharing the
 * same field-locking matrix between create and edit modes.
 *
 * Start and end are the program slot; the margins extend it on each side,
 * and a summary line gives the window actually recorded.
 *
 * @param {Object} props - Component props
 * @param {Object} props.values - Form values from useRecordingForm
 * @param {Function} props.setField - Input event setter from useRecordingForm
 * @param {Object} props.locks - Lock matrix from useRecordingForm
 * @param {number} props.startTs - Program start (seconds)
 * @param {number} props.endTs - Program end (seconds)
 * @param {number} props.marginBefore - Margin before start (seconds)
 * @param {number} props.marginAfter - Margin after end (seconds)
 * @param {Array|null|undefined} props.mediaList - Available media options
 * @returns {React.ReactElement} Field group
 */

import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { formatDuration, formatTime } from '@/utils/time';

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'hd', label: 'HD' },
  { value: 'sd', label: 'SD' },
  { value: 'ld', label: 'LD' },
];

const formatBytes = (bytes) => `${(bytes / 1024 ** 3).toFixed(1)} Go`;

const DateTimeField = ({ label, value, onChange, disabled }) => (
  <TextField
    label={label}
    type="datetime-local"
    value={value}
    onChange={onChange}
    fullWidth
    required
    size="small"
    disabled={disabled}
    slotProps={{ inputLabel: { shrink: true } }}
  />
);

const MarginField = ({ label, value, onChange, disabled }) => (
  <TextField
    label={label}
    type="number"
    value={value}
    onChange={onChange}
    size="small"
    fullWidth
    disabled={disabled}
    slotProps={{ htmlInput: { min: 0, step: 1 } }}
  />
);

const ScheduleFields = ({ values, setField, locks, startTs, endTs, marginBefore, marginAfter }) => {
  // A finished recording has no margins left to show or edit.
  const showMargins = locks.marginBefore || locks.marginAfter || marginBefore > 0 || marginAfter > 0;
  const recordedStart = startTs - marginBefore;
  const recordedEnd = endTs + marginAfter;
  const duration = endTs - startTs;

  return (
    <>
      <DateTimeField label="Début" value={values.start} onChange={setField('start')} disabled={!locks.start} />
      <DateTimeField label="Fin" value={values.end} onChange={setField('end')} disabled={!locks.end} />

      {showMargins && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <MarginField
            label="Marge avant (min)"
            value={values.marginBefore}
            onChange={setField('marginBefore')}
            disabled={!locks.marginBefore}
          />
          <MarginField
            label="Marge après (min)"
            value={values.marginAfter}
            onChange={setField('marginAfter')}
            disabled={!locks.marginAfter}
          />
        </Box>
      )}

      {duration > 0 && (
        <Typography variant="caption" color="text.secondary">
          Enregistrement de {formatTime(recordedStart)} à {formatTime(recordedEnd)} (
          {formatDuration(recordedEnd - recordedStart)})
        </Typography>
      )}
    </>
  );
};

const RecordingFormFields = ({ values, setField, locks, startTs, endTs, marginBefore, marginAfter, mediaList }) => (
  <>
    <TextField
      label="Nom"
      value={values.name}
      onChange={setField('name')}
      fullWidth
      required
      size="small"
      disabled={!locks.name}
    />
    <TextField
      label="Sous-titre"
      value={values.subname}
      onChange={setField('subname')}
      fullWidth
      size="small"
      disabled={!locks.subname}
    />

    <ScheduleFields
      values={values}
      setField={setField}
      locks={locks}
      startTs={startTs}
      endTs={endTs}
      marginBefore={marginBefore}
      marginAfter={marginAfter}
    />

    <TextField
      label="Qualité"
      value={values.quality}
      onChange={setField('quality')}
      select
      fullWidth
      size="small"
      disabled={!locks.quality}
    >
      {QUALITY_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>

    {mediaList?.length > 0 && (
      <TextField
        label="Support"
        value={values.media}
        onChange={setField('media')}
        select
        fullWidth
        size="small"
        disabled={!locks.media}
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
      value={values.path}
      onChange={setField('path')}
      fullWidth
      size="small"
      disabled={!locks.path}
    />
  </>
);

export default RecordingFormFields;
