/**
 * Short message at the bottom of the screen after an action, with an
 * optional « Annuler » button. Hides itself after a few seconds.
 *
 * @param {Object} props - Component props
 * @param {{ message: string, severity?: 'success'|'error', undo?: Function }|null} props.notice - Notice to show,
 *   or null for none
 * @param {Function} props.onClose - Called when the notice should go away
 * @returns {React.ReactElement} Snackbar
 */

import { useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';

const AUTO_HIDE_MS = 6000;

const NoticeSnackbar = ({ notice, onClose }) => {
  // The last notice stays rendered while the snackbar fades out; its key
  // only changes with a new notice, which restarts the hide timer.
  const [shown, setShown] = useState({ notice, key: 0 });
  if (notice !== null && notice !== shown.notice) {
    setShown({ notice, key: shown.key + 1 });
  }
  const current = shown.notice;

  const handleClose = (_event, reason) => {
    // A click on the grid (a drag, a program) should not dismiss it.
    if (reason !== 'clickaway') onClose();
  };

  const handleUndo = () => {
    current.undo();
    onClose();
  };

  return (
    <Snackbar
      key={shown.key}
      open={notice !== null}
      autoHideDuration={AUTO_HIDE_MS}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {current ? (
        <Alert
          severity={current.severity ?? 'success'}
          variant="filled"
          onClose={onClose}
          action={
            current.undo ? (
              <Button color="inherit" size="small" onClick={handleUndo}>
                Annuler
              </Button>
            ) : undefined
          }
        >
          {current.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
};

export default NoticeSnackbar;
