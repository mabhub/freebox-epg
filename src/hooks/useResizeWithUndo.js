/**
 * Save a resized recording and describe the outcome as a notice for
 * NoticeSnackbar: a confirmation with an undo, or the Freebox's refusal.
 * @module hooks/useResizeWithUndo
 */

import { useCallback, useState } from 'react';

import { useResizeRecording } from '@/hooks/usePvr';
import { formatTime } from '@/utils/time';

/**
 * @returns {{ notice: Object|null, resize: Function, closeNotice: Function }} Current notice,
 *   `resize(recording, { start, end })` to save a new program slot, and `closeNotice()`
 */
const useResizeWithUndo = () => {
  const { mutate } = useResizeRecording();
  const [notice, setNotice] = useState(null);

  const showError = useCallback((error) => {
    setNotice({ message: `Modification refusée par la Freebox : ${error.message}`, severity: 'error' });
  }, []);

  const resize = useCallback(
    (recording, { start, end }) => {
      // The slot the recording had before the drag.
      const undo = () =>
        mutate({ recording, start: recording.raw.start, end: recording.raw.end }, { onError: showError });
      mutate(
        { recording, start, end },
        {
          onSuccess: () =>
            setNotice({ message: `Enregistrement modifié : ${formatTime(start)} – ${formatTime(end)}`, undo }),
          onError: showError,
        },
      );
    },
    [mutate, showError],
  );

  const closeNotice = useCallback(() => setNotice(null), []);

  return { notice, resize, closeNotice };
};

export default useResizeWithUndo;
