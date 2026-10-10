/**
 * Top-level component: gates the router on the auth status, falling
 * back to the LoginPage when the session check returns logged_in=false,
 * or to a retry screen when the check itself failed (Freebox unreachable).
 */

import { BrowserRouter, Routes, Route } from 'react-router';
import { Alert, Box, Button, CircularProgress } from '@mui/material';

import { useAuth } from '@/hooks/useAuth';
import EpgPage from './components/epg/EpgPage';
import LoginPage from './components/LoginPage';
import NotFound from './components/NotFound';

const App = () => {
  const { data, isLoading, error, refetch } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  /* Without data the login status is unknown: asking for a password would
     hide the real problem, since login() starts with the same check. */
  if (error && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Réessayer
            </Button>
          }
        >
          {error.message}
        </Alert>
      </Box>
    );
  }

  if (!data?.logged_in) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EpgPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
