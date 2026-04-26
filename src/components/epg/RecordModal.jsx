/**
 * Modal for scheduling a new PVR recording or editing an existing one.
 *
 * Two mutually-exclusive modes are driven by the props:
 * - **Create**: pass `program`, `channelUuid`, `channelName`
 * - **Edit**: pass `recording` (unified shape from transformers.js)
 *
 * In edit mode, the form pre-fills from the recording payload and field
 * editability is constrained by the recording's `kind` and `state`. The
 * delete action is exposed alongside save; for a `running` programmed
 * timer the button is labelled "Arrêter" since the Freebox treats DELETE
 * as a stop request.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Close callback
 * @param {Object|null} [props.program] - Program data (create mode)
 * @param {string} [props.channelUuid] - Channel UUID (create mode)
 * @param {string} [props.channelName] - Channel display name (create mode)
 * @param {Object|null} [props.recording] - Existing recording (edit mode)
 * @returns {React.ReactElement} Modal
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

import {
  usePvrConfig,
  usePvrMedia,
  useCreateRecording,
  useUpdateRecording,
  useDeleteRecording,
} from '@/hooks/usePvr';
import useRecordingForm from '@/hooks/useRecordingForm';
import { buildCreatePayload, buildUpdatePayload } from '@/utils/recordingPayload';

import RecordingFormFields from './RecordingFormFields';

const SUCCESS_AUTO_CLOSE_MS = 1500;

const computeSuccessMessage = ({ isEdit, deleteRecording }) => {
  if (deleteRecording.isSuccess) return 'Enregistrement supprimé';
  return isEdit ? 'Enregistrement mis à jour' : 'Enregistrement programmé';
};

const submitButtonLabel = (isEdit) => (isEdit ? 'Enregistrer les modifications' : 'Programmer');

const DeleteButton = ({ recording, confirmDelete, onClick, deleteRecording }) => {
  const baseLabel = recording.state === 'running' ? 'Arrêter' : 'Supprimer';
  let label;
  if (deleteRecording.isPending) {
    label = <CircularProgress size={20} />;
  } else if (confirmDelete) {
    label = `Confirmer (${baseLabel})`;
  } else {
    label = baseLabel;
  }
  return (
    <Box sx={{ flex: 1 }}>
      <Button
        color={confirmDelete ? 'error' : 'inherit'}
        variant={confirmDelete ? 'contained' : 'text'}
        onClick={onClick}
        disabled={deleteRecording.isPending || deleteRecording.isSuccess}
      >
        {label}
      </Button>
    </Box>
  );
};

const RecordModal = ({ open, onClose, program, channelUuid, channelName, recording }) => {
  const { data: pvrConfig } = usePvrConfig();
  const { data: mediaList } = usePvrMedia();
  const createRecording = useCreateRecording();
  const updateRecording = useUpdateRecording();
  const deleteRecording = useDeleteRecording();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { values, setField, locks, startTs, endTs, duration, isEdit } = useRecordingForm({
    open, recording, program, pvrConfig, mediaList,
  });

  // Reset all mutation states + delete confirmation when the modal opens
  // — otherwise stale success/error alerts would flash on the next open.
  useEffect(() => {
    if (open) {
      createRecording.reset();
      updateRecording.reset();
      deleteRecording.reset();
      setConfirmDelete(false);
    }
  }, [open, createRecording, updateRecording, deleteRecording]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isEdit) {
      updateRecording.mutate({
        id: recording.id,
        kind: recording.kind,
        payload: buildUpdatePayload({ recording, values, locks, startTs, endTs }),
      });
    } else {
      createRecording.mutate(
        buildCreatePayload({ values, channelUuid, channelName, startTs, endTs }),
      );
    }
  };

  const handleDelete = () => {
    if (!isEdit) return;
    if (confirmDelete) {
      deleteRecording.mutate({ id: recording.id, kind: recording.kind });
    } else {
      setConfirmDelete(true);
    }
  };

  // Auto-close on success — same delay across create / update / delete.
  const successFlag = createRecording.isSuccess || updateRecording.isSuccess || deleteRecording.isSuccess;
  useEffect(() => {
    if (!successFlag) return;
    const timer = setTimeout(onClose, SUCCESS_AUTO_CLOSE_MS);
    // eslint-disable-next-line consistent-return -- timer cleanup
    return () => clearTimeout(timer);
  }, [successFlag, onClose]);

  const isOccurrence = isEdit && recording.generatorId !== null;
  const submitPending = createRecording.isPending || updateRecording.isPending;
  const formIncomplete = !values.name || !values.start || !values.end || duration <= 0;
  const submitDisabled = submitPending || successFlag || formIncomplete;
  const errorMessage = (createRecording.error ?? updateRecording.error ?? deleteRecording.error)?.message;
  const successMessage = computeSuccessMessage({ isEdit, deleteRecording });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEdit ? 'Modifier l\'enregistrement' : 'Programmer un enregistrement'}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {isOccurrence && (
            <Alert severity="info">
              Cet enregistrement fait partie d&apos;une programmation récurrente. Modifier la série pour changer les autres champs.
            </Alert>
          )}

          <RecordingFormFields
            values={values}
            setField={setField}
            locks={locks}
            duration={duration}
            mediaList={mediaList}
          />

          {confirmDelete && !deleteRecording.isSuccess && (
            <Alert severity="warning">
              Confirmer la suppression de cet enregistrement ?
            </Alert>
          )}
          {successFlag && <Alert severity="success">{successMessage}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </DialogContent>

        <DialogActions>
          {isEdit && (
            <DeleteButton
              recording={recording}
              confirmDelete={confirmDelete}
              onClick={handleDelete}
              deleteRecording={deleteRecording}
            />
          )}
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitDisabled}>
            {submitPending ? <CircularProgress size={20} /> : submitButtonLabel(isEdit)}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RecordModal;
