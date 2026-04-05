/**
 * Main layout component for the EPG application
 * Full-viewport flex column with toolbar and content area
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {React.ReactElement} Layout wrapper
 */

import { Box } from '@mui/material';

const Layout = ({ children }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}
  >
    {children}
  </Box>
);

export default Layout;
