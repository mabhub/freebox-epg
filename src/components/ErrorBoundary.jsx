import React from 'react';
import {
  Alert,
  Button,
  Container,
  Typography,
  Box,
} from '@mui/material';

/**
 * Error Boundary component to catch and handle React errors gracefully
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Function} props.fallback - Optional custom fallback component
 * @returns {React.ReactElement} Error boundary wrapper
 */
class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError (error) {
    return { hasError: true, error };
  }

  componentDidCatch (error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render () {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" component="h1" gutterBottom>
                Une erreur inattendue s'est produite
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                L'application a rencontré un problème. Veuillez réessayer ou contacter le
                support si le problème persiste.
              </Typography>
              {import.meta.env.DEV && error && (
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    textAlign: 'left',
                    backgroundColor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.75rem',
                  }}
                >
                  {error.toString()}
                </Typography>
              )}
            </Alert>
            <Button
              variant="contained"
              onClick={this.handleRetry}
              size="large"
            >
              Réessayer
            </Button>
          </Box>
        </Container>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
