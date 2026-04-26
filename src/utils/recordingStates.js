/**
 * Visual mappings for recording states: localised labels and theme-aware
 * accent colours used by the overlay cells and tooltips.
 * @module utils/recordingStates
 */

/**
 * Human-readable French labels for each normalised recording state.
 * @type {Record<string, string>}
 */
export const RECORDING_STATE_LABELS = {
  waiting: 'En attente',
  running: 'En cours',
  failed: 'Échec',
  disabled: 'Désactivé',
  finished: 'Terminé',
};

/**
 * Resolve the accent colour for a recording state, sourcing values from
 * the active MUI theme so the overlay reads correctly in light and dark
 * modes.
 * @param {Object} theme - MUI theme
 * @param {string} state - Normalised state
 * @returns {string} CSS colour
 */
export const getRecordingStateColor = (theme, state) => {
  switch (state) {
    case 'running':
      return theme.palette.error.main;
    case 'failed':
      return theme.palette.warning.main;
    case 'finished':
      return theme.palette.success.main;
    case 'disabled':
      return theme.palette.text.disabled;
    default:
      return theme.palette.info.main;
  }
};
