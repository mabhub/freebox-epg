/**
 * Which fields of a recording may still change, shared by the edit modal
 * and the resize handles of the overlay cells.
 * @module utils/recordingLocks
 */

const ALL_LOCKS_FREE = {
  name: true,
  subname: true,
  start: true,
  end: true,
  marginBefore: true,
  marginAfter: true,
  quality: true,
  media: true,
  path: true,
};

const FINISHED_LOCKS = {
  name: true,
  subname: true,
  start: false,
  end: false,
  marginBefore: false,
  marginAfter: false,
  quality: false,
  media: false,
  path: true,
};

const RUNNING_LOCKS = {
  name: false,
  subname: true,
  start: false,
  end: true,
  marginBefore: false,
  marginAfter: true,
  quality: false,
  media: false,
  path: false,
};

const OCCURRENCE_LOCKS = {
  name: true,
  subname: true,
  start: false,
  end: false,
  marginBefore: false,
  marginAfter: false,
  quality: false,
  media: false,
  path: false,
};

/**
 * Per-field editability matrix for an existing recording. In create mode
 * the caller passes `null` and gets the all-free matrix.
 * @param {Object|null} recording - Recording in edit mode (null in create mode)
 * Each margin shares the lock of the bound it extends.
 * @returns {{ name: boolean, subname: boolean, start: boolean, end: boolean, marginBefore: boolean, marginAfter: boolean, quality: boolean, media: boolean, path: boolean }} Per-field editability
 */
const computeFieldLocks = (recording) => {
  if (!recording) return ALL_LOCKS_FREE;
  if (recording.kind === 'finished') return FINISHED_LOCKS;
  if (recording.state === 'running') return RUNNING_LOCKS;
  if (recording.generatorId !== null) return OCCURRENCE_LOCKS;
  return ALL_LOCKS_FREE;
};

export default computeFieldLocks;
