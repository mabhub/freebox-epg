/**
 * Aggregate programmed and finished recordings into a Map keyed by
 * channel UUID, sorted by `start` ascending. Drives the rendering of the
 * EPG recordings overlay.
 * @module hooks/useRecordingsByChannel
 */

import { useMemo } from 'react';
import useCurrentTime from '@/hooks/useCurrentTime';
import { usePvrProgrammed, usePvrFinished } from '@/hooks/usePvr';

const EMPTY_MAP = new Map();

/**
 * Build a Map<channelUuid, Recording[]> combining programmed and finished
 * recordings. Recordings without a channel UUID (rare, but possible if
 * the channel left the bouquet) are dropped silently.
 * @returns {Map<string, Array>} Indexed, sorted recordings
 */
const useRecordingsByChannel = () => {
  const now = useCurrentTime();
  const { data: programmed } = usePvrProgrammed();
  const { data: finished } = usePvrFinished(now);

  return useMemo(() => {
    const programmedList = programmed ?? [];
    const finishedList = finished ?? [];

    if (programmedList.length === 0 && finishedList.length === 0) {
      return EMPTY_MAP;
    }

    // A recording in progress is listed by both endpoints under the same id.
    // Keep the programmed timer: it carries the live state and stopping it
    // goes through /pvr/programmed/.
    const programmedIds = new Set(programmedList.map((recording) => recording.id));
    const finishedOnly = finishedList.filter((recording) => !programmedIds.has(recording.id));

    const byChannel = new Map();

    for (const recording of [...programmedList, ...finishedOnly]) {
      if (recording.channelUuid) {
        const list = byChannel.get(recording.channelUuid);
        if (list) {
          list.push(recording);
        } else {
          byChannel.set(recording.channelUuid, [recording]);
        }
      }
    }

    for (const list of byChannel.values()) {
      list.sort((a, b) => a.start - b.start);
    }

    return byChannel;
  }, [programmed, finished]);
};

export default useRecordingsByChannel;
