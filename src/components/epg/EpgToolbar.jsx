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
  Logout as LogoutIcon,
} from '@mui/icons-material';

import { setTimeOrigin } from '@/store/epgSlice';
import { nowTimestamp, todayAt } from '@/utils/time';
import { PRIME_TIME_HOUR, PRIME_TIME_MINUTE } from '@/utils/constants';
import { useLogout } from '@/hooks/useAuth';

const EpgToolbar = ({ onToggleFilter }) => {
  const dispatch = useDispatch();
  const logoutMutation = useLogout();

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
            aria-label={`Aller au prime time ${PRIME_TIME_HOUR}h${String(PRIME_TIME_MINUTE).padStart(2, '0')}`}
          >
            {PRIME_TIME_HOUR}h{String(PRIME_TIME_MINUTE).padStart(2, '0')}
          </Button>
        </Box>

        <IconButton
          color="inherit"
          onClick={onToggleFilter}
          aria-label="Filtrer les chaînes"
        >
          <FilterListIcon />
        </IconButton>

        <IconButton
          color="inherit"
          onClick={() => logoutMutation.mutate()}
          aria-label="Déconnexion"
          disabled={logoutMutation.isPending}
        >
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default EpgToolbar;
