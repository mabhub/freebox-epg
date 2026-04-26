/**
 * Top-level component: gates the router on the auth status, falling
 * back to the LoginPage when the session check returns logged_in=false.
 */

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router';
import { Box, CircularProgress } from '@mui/material';

import { useAuth } from '@/hooks/useAuth';
import EpgPage from './components/epg/EpgPage';
import LoginPage from './components/LoginPage';
import NotFound from './components/NotFound';

const App = () => {
  const { data, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
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
