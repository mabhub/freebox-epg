/**
 * Form fields for the recording modal: name, subname, program slot, margins,
 * quality, media, path. The JSX-heavy markup is split out of RecordModal so
 * that file stays under the project's complexity budget while sharing the
 * same field-locking matrix between create and edit modes.
 *
 * Start and end are the program slot; the margins extend it on each side,
 * and a summary line gives the window actually recorded. Dates are typed in
 * French with a 24-hour clock whatever the browser locale.
 *
 * @param {Object} props - Component props
 * @param {Object} props.values - Form values from useRecordingForm
 * @param {Function} props.setField - Input event setter from useRecordingForm
 * @param {Function} props.setFieldValue - Raw value setter from useRecordingForm
 * @param {Object} props.locks - Lock matrix from useRecordingForm
 * @param {number} props.startTs - Program start (seconds)
 * @param {number} props.endTs - Program end (seconds)
 * @param {number} props.marginBefore - Margin before start (seconds)
 * @param {number} props.marginAfter - Margin after end (seconds)
 * @param {Array|null|undefined} props.mediaList - Available media options
 * @returns {React.ReactElement} Field group
 */

import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { frFR } from '@mui/x-date-pickers/locales';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { formatDuration, formatTime } from '@/utils/time';

// Same string shape as the former datetime-local inputs, so the form state
// and its timestamp conversions stay unchanged.
const FORM_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm';
const PICKER_LOCALE_TEXT = frFR.components.MuiLocalizationProvider.defaultProps.localeText;

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'hd', label: 'HD' },
  { value: 'sd', label: 'SD' },
  { value: 'ld', label: 'LD' },
];

const formatBytes = (bytes) => `${(bytes / 1024 ** 3).toFixed(1)} Go`;

const DateTimeField = ({ label, value, onChange, disabled }) => (
  <DateTimePicker
    label={label}
    value={value ? dayjs(value) : null}
    onChange={(date) => onChange(date?.isValid() ? date.format(FORM_DATETIME_FORMAT) : '')}
    ampm={false}
    disabled={disabled}
    slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
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

const ScheduleFields = ({ values, setField, setFieldValue, locks, startTs, endTs, marginBefore, marginAfter }) => {
  // A finished recording has no margins left to show or edit.
  const showMargins = locks.marginBefore || locks.marginAfter || marginBefore > 0 || marginAfter > 0;
  const recordedStart = startTs - marginBefore;
  const recordedEnd = endTs + marginAfter;
  const duration = endTs - startTs;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr" localeText={PICKER_LOCALE_TEXT}>
      <DateTimeField label="Début" value={values.start} onChange={setFieldValue('start')} disabled={!locks.start} />
      <DateTimeField label="Fin" value={values.end} onChange={setFieldValue('end')} disabled={!locks.end} />

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
    </LocalizationProvider>
  );
};

const RecordingFormFields = ({
  values,
  setField,
  setFieldValue,
  locks,
  startTs,
  endTs,
  marginBefore,
  marginAfter,
  mediaList,
}) => (
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
      setFieldValue={setFieldValue}
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
