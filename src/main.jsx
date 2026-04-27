import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  createTheme,
  CssBaseline,
  responsiveFontSizes,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthError, ApiHttpError } from '@/api/client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';

import App from './App';
import store from './store';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AuthError) {
        queryClient.setQueryData(['auth'], (old) => ({ ...old, logged_in: false }));
      }
    },
  }),
  defaultOptions: {
    queries: {
      // The Freebox returns 503 "Limite de connexion dépassée" under
      // load. Auth and 4xx other than 503 are not worth retrying; for
      // 503 (and bare network errors with no status, typical of an
      // aborted connection), retry up to 5 times with exponential
      // backoff capped at 30 s. Combined with the apiFetch concurrency
      // limit, this is enough to absorb a full-viewport burst.
      retry: (failureCount, error) => {
        if (error instanceof AuthError) return false;
        const status = error instanceof ApiHttpError ? error.status : null;
        const transient = status === null || status === 503 || status === 429;
        return transient && failureCount < 5;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
      // 5 minutes
      staleTime: 5 * 60 * 1000,
    },
  },
});

const ThemeWrapper = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(() => responsiveFontSizes(createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
      primary: {
        main: '#adb31b',
      },
      secondary: {
        main: '#ff6b35',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  })), [prefersDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.querySelector('#root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeWrapper />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
