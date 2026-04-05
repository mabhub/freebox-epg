import { AppBar, Toolbar, Typography, Container, Box, IconButton } from '@mui/material';
import { GitHub } from '@mui/icons-material';

/**
 * Get background color based on theme mode
 *
 * @param {import('@mui/material').Theme} theme - MUI theme object
 * @returns {string} Background color
 */
const getFooterBackgroundColor = (theme) => {
  const { palette: { mode, grey } } = theme;
  return mode === 'light' ? grey[200] : grey[800];
};

/**
 * Main layout component with AppBar and content container
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {React.ReactElement} Layout wrapper
 */
const Layout = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {import.meta.env.VITE_APP_TITLE || 'Vite React MUI'}
        </Typography>
        <IconButton
          color="inherit"
          href={import.meta.env.VITE_GITHUB_URL || 'https://github.com'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
        >
          <GitHub />
        </IconButton>
      </Toolbar>
    </AppBar>

    <Container
      component="main"
      maxWidth="lg"
      sx={{
        flexGrow: 1,
        py: 3,
      }}
    >
      {children}
    </Container>

    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: getFooterBackgroundColor,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          Built with Vite, React 19, Material-UI v7 & TanStack Query v5
        </Typography>
      </Container>
    </Box>
  </Box>
);

export default Layout;
