/**
 * Form state for the create/edit recording modal: local field values, the
 * field-locking matrix, and a derived duration. Pre-fills from either an
 * existing recording (edit mode) or a program + PVR margins (create mode).
 * @module hooks/useRecordingForm
 */

import { useEffect, useMemo, useState } from 'react';
import { datetimeLocalToTimestamp, timestampToDatetimeLocal } from '@/utils/time';

const DEFAULT_PATH = 'Enregistrements';
const DEFAULT_QUALITY = 'auto';

const ALL_LOCKS_FREE = {
  name: true,
  subname: true,
  start: true,
  end: true,
  quality: true,
  media: true,
  path: true,
};

const FINISHED_LOCKS = {
  name: true, subname: true, start: false, end: false, quality: false, media: false, path: true,
};

const RUNNING_LOCKS = {
  name: false, subname: true, start: false, end: true, quality: false, media: false, path: false,
};

const OCCURRENCE_LOCKS = {
  name: true, subname: true, start: false, end: false, quality: false, media: false, path: false,
};

/**
 * Per-field editability matrix for an existing recording. In create mode
 * the caller passes `null` and gets the all-free matrix.
 * @param {Object|null} recording - Recording in edit mode (null in create mode)
 * @returns {{ name: boolean, subname: boolean, start: boolean, end: boolean, quality: boolean, media: boolean, path: boolean }} Per-field editability
 */
export const computeFieldLocks = (recording) => {
  if (!recording) return ALL_LOCKS_FREE;
  if (recording.kind === 'finished') return FINISHED_LOCKS;
  if (recording.state === 'running') return RUNNING_LOCKS;
  if (recording.generatorId !== null) return OCCURRENCE_LOCKS;
  return ALL_LOCKS_FREE;
};

/**
 * Derive the create-mode initial values from a program payload and PVR
 * margins. Pulled out so the main hook keeps its statement count low.
 * @param {Object} program - Program payload (from useProgramDetail)
 * @param {Object|null|undefined} pvrConfig - PVR config (margins)
 * @returns {Object} Initial form values
 */
const valuesFromProgram = (program, pvrConfig) => {
  const marginBefore = pvrConfig?.margin_before ?? 0;
  const marginAfter = pvrConfig?.margin_after ?? 0;
  return {
    name: program.title ?? '',
    subname: program.sub_title ?? '',
    start: timestampToDatetimeLocal(program.date - marginBefore),
    end: timestampToDatetimeLocal(program.date + program.duration + marginAfter),
    quality: DEFAULT_QUALITY,
    media: '',
    path: DEFAULT_PATH,
  };
};

/**
 * Derive the edit-mode initial values from an existing recording.
 * @param {Object} recording - Recording in unified shape
 * @returns {Object} Initial form values
 */
const valuesFromRecording = (recording) => ({
  name: recording.name ?? '',
  subname: recording.subname ?? '',
  start: timestampToDatetimeLocal(recording.start),
  end: timestampToDatetimeLocal(recording.end),
  quality: recording.raw?.channel_quality ?? DEFAULT_QUALITY,
  media: recording.raw?.media ?? '',
  path: recording.raw?.path ?? DEFAULT_PATH,
});

/**
 * Form state hook for the recording modal. Re-prefills whenever the modal
 * opens or the underlying program/recording changes.
 *
 * @param {Object} args - Hook arguments
 * @param {boolean} args.open - Whether the modal is visible
 * @param {Object|null} args.recording - Recording for edit mode
 * @param {Object|null} args.program - Program for create mode
 * @param {Object|null|undefined} args.pvrConfig - PVR config for default margins
 * @param {Array|null|undefined} args.mediaList - Available media (used to default the support in create mode)
 * @returns {Object} Form values, setters, derived data, and locks
 */
const useRecordingForm = ({ open, recording, program, pvrConfig, mediaList }) => {
  const isEdit = recording !== null && recording !== undefined;
  const [values, setValues] = useState({
    name: '', subname: '', start: '', end: '',
    quality: DEFAULT_QUALITY, media: '', path: DEFAULT_PATH,
  });

  const locks = useMemo(() => computeFieldLocks(recording), [recording]);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setValues(valuesFromRecording(recording));
    } else if (program) {
      setValues(valuesFromProgram(program, pvrConfig));
    }
  }, [open, isEdit, recording, program, pvrConfig]);

  // Default support to the first available media in create mode.
  useEffect(() => {
    if (!isEdit && mediaList?.length) {
      setValues((prev) => (prev.media ? prev : { ...prev, media: mediaList[0].media }));
    }
  }, [mediaList, isEdit]);

  const setField = useMemo(
    () => (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value })),
    [],
  );

  const startTs = values.start ? datetimeLocalToTimestamp(values.start) : 0;
  const endTs = values.end ? datetimeLocalToTimestamp(values.end) : 0;

  return {
    values,
    setField,
    locks,
    startTs,
    endTs,
    duration: endTs - startTs,
    isEdit,
  };
};

export default useRecordingForm;
