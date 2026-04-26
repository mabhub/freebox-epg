/**
 * Login form for the Freebox session. Handles a 30-second client-side
 * lockout after a `ratelimited` error from the API, mirroring the
 * Freebox OS behaviour.
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material';

import { useLogin } from '@/hooks/useAuth';

const LOCKOUT_SECONDS = 30;

const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const loginMutation = useLogin();

  const locked = remainingSeconds > 0;

  useEffect(() => {
    if (loginMutation.error?.code !== 'ratelimited') return;
    setRemainingSeconds(LOCKOUT_SECONDS);
  }, [loginMutation.error]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setTimeout(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loginMutation.mutate(password);
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h5" align="center">
          {import.meta.env.VITE_APP_TITLE ?? 'Freebox EPG'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type="password"
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            fullWidth
            disabled={loginMutation.isPending || locked}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loginMutation.isPending || locked || !password}
          >
            {loginMutation.isPending && <CircularProgress size={24} />}
            {!loginMutation.isPending && (locked ? `Patientez ${remainingSeconds}s` : 'Connexion')}
          </Button>

          {loginMutation.isError && (
            <Alert severity={locked ? 'warning' : 'error'}>
              {loginMutation.error?.message ?? 'Erreur de connexion'}
            </Alert>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
