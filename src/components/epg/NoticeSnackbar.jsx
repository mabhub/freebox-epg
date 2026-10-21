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

import { Alert, Button, Snackbar } from '@mui/material';

const AUTO_HIDE_MS = 6000;

const NoticeSnackbar = ({ notice, onClose }) => {
  const handleClose = (_event, reason) => {
    // A click on the grid (a drag, a program) should not dismiss it.
    if (reason !== 'clickaway') onClose();
  };

  const handleUndo = () => {
    notice.undo();
    onClose();
  };

  return (
    <Snackbar
      // Restart the timer for each new notice.
      key={notice?.message}
      open={notice !== null}
      autoHideDuration={AUTO_HIDE_MS}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {notice ? (
        <Alert
          severity={notice.severity ?? 'success'}
          variant="filled"
          onClose={onClose}
          action={
            notice.undo ? (
              <Button color="inherit" size="small" onClick={handleUndo}>
                Annuler
              </Button>
            ) : undefined
          }
        >
          {notice.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
};

export default NoticeSnackbar;
