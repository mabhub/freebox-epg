/**
 * What a click on a series band opens: the recording that already covers
 * the run, like the program modal does, or else the creation form.
 * @module hooks/useRecordGroup
 */

import { useCallback, useRef, useState } from 'react';
import useRecordingsByChannel from '@/hooks/useRecordingsByChannel';
import { findRecordingCoveringProgram } from '@/utils/recordingPosition';

/**
 * @param {Function} onEditRecording - Called with the recording that already covers a run
 * @returns {{ target: { program: Object, channelUuid: string, channelName: string }|null,
 *   recordGroup: Function, closeTarget: Function }} Creation form props (null when closed), band click
 *   handler `(program, channel)`, and form close handler; both handlers keep their identity
 */
const useRecordGroup = (onEditRecording) => {
  const recordingsByChannel = useRecordingsByChannel();
  // Read through a ref: the recordings change every minute, and a new
  // handler would re-render every channel row.
  const recordingsRef = useRef(recordingsByChannel);
  recordingsRef.current = recordingsByChannel;
  const [target, setTarget] = useState(null);

  const recordGroup = useCallback(
    (program, channel) => {
      const covering = findRecordingCoveringProgram(recordingsRef.current.get(channel.uuid), program);
      if (covering) {
        onEditRecording(covering);
      } else {
        setTarget({ program, channelUuid: channel.uuid, channelName: channel.name });
      }
    },
    [onEditRecording],
  );
  const closeTarget = useCallback(() => setTarget(null), []);

  return { target, recordGroup, closeTarget };
};

export default useRecordGroup;
