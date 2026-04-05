/**
 * EPG toolbar with time navigation and channel filter controls
 *
 * @returns {React.ReactElement} Toolbar component
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

import { setTimeOrigin } from '@/store/epgSlice';
import { nowTimestamp } from '@/utils/time';
import { PRIME_TIME_HOUR, PRIME_TIME_MINUTE } from '@/utils/constants';

/**
 * Build a Unix timestamp for today at a given hour and minute
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {number} Unix timestamp in seconds
 */
const todayAt = (hour, minute) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

const EpgToolbar = ({ onToggleFilter }) => {
  const dispatch = useDispatch();

  const handleGoToNow = useCallback(() => {
    dispatch(setTimeOrigin(nowTimestamp()));
  }, [dispatch]);

  const handleGoToPrimeTime = useCallback(() => {
    dispatch(setTimeOrigin(todayAt(PRIME_TIME_HOUR, PRIME_TIME_MINUTE)));
  }, [dispatch]);

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar variant="dense">
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          {import.meta.env.VITE_APP_TITLE ?? 'EPG'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          <Button
            color="inherit"
            size="small"
            startIcon={<AccessTimeIcon />}
            onClick={handleGoToNow}
          >
            Maintenant
          </Button>
          <Button
            color="inherit"
            size="small"
            onClick={handleGoToPrimeTime}
          >
            20h30
          </Button>
        </Box>

        <IconButton
          color="inherit"
          onClick={onToggleFilter}
          aria-label="Filtrer les chaînes"
        >
          <FilterListIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default EpgToolbar;
