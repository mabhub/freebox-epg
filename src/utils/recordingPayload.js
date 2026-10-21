/**
 * Pure builders for the payload sent to the Freebox PVR API on create or
 * update. Kept out of the modal so the rules around which fields are sent
 * (driven by the per-field lock matrix in edit mode) can be unit-tested.
 * @module utils/recordingPayload
 */

/**
 * Build the body for `POST /pvr/programmed/`.
 * @param {Object} args - Inputs
 * @param {Object} args.values - Form values
 * @param {string} args.channelUuid - Channel UUID
 * @param {string} args.channelName - Channel display name
 * @param {number} args.startTs - Start timestamp (seconds)
 * @param {number} args.endTs - End timestamp (seconds)
 * @param {number} args.marginBefore - Margin before start (seconds)
 * @param {number} args.marginAfter - Margin after end (seconds)
 * @returns {Object} Create payload
 */
export const buildCreatePayload = ({
  values,
  channelUuid,
  channelName,
  startTs,
  endTs,
  marginBefore,
  marginAfter,
}) => ({
  channel_uuid: channelUuid,
  channel_name: channelName,
  channel_quality: values.quality,
  broadcast_type: 'tv',
  name: values.name,
  subname: values.subname,
  start: startTs,
  end: endTs,
  margin_before: marginBefore,
  margin_after: marginAfter,
  media: values.media,
  path: values.path,
  enabled: true,
});

/**
 * Build the body for `PUT /pvr/programmed/{id}` or
 * `PUT /pvr/finished/{id}`. The starting point is the original raw
 * payload so the Freebox keeps any field it sent us; we then overlay the
 * fields whose lock allows them to change.
 *
 * @param {Object} args - Inputs
 * @param {Object} args.recording - Recording in edit mode
 * @param {Object} args.values - Form values
 * @param {Object} args.locks - Per-field lock matrix from computeFieldLocks
 * @param {number} args.startTs - Start timestamp (seconds)
 * @param {number} args.endTs - End timestamp (seconds)
 * @param {number} args.marginBefore - Margin before start (seconds)
 * @param {number} args.marginAfter - Margin after end (seconds)
 * @returns {Object} Update payload
 */
export const buildUpdatePayload = ({ recording, values, locks, startTs, endTs, marginBefore, marginAfter }) => ({
  ...recording.raw,
  ...(locks.name && { name: values.name }),
  ...(locks.subname && { subname: values.subname }),
  ...(locks.start && { start: startTs }),
  ...(locks.end && { end: endTs }),
  ...(locks.marginBefore && { margin_before: marginBefore }),
  ...(locks.marginAfter && { margin_after: marginAfter }),
  ...(locks.quality && { channel_quality: values.quality }),
  ...(locks.media && { media: values.media }),
  ...(locks.path && { path: values.path }),
});
