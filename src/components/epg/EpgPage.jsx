/**
 * Main EPG page component
 * Orchestrates the toolbar, grid, modals, and filter drawer
 *
 * @returns {React.ReactElement} EPG page
 */

import { useState, useCallback } from 'react';
import { Box } from '@mui/material';

import Layout from '@/components/Layout';
import EpgToolbar from './EpgToolbar';

const EpgPage = () => {
  const [_filterOpen, setFilterOpen] = useState(false);

  const handleToggleFilter = useCallback(() => {
    setFilterOpen((prev) => !prev);
  }, []);

  return (
    <Layout>
      <EpgToolbar onToggleFilter={handleToggleFilter} />
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* EpgGrid will be rendered here in phase 4 */}
      </Box>
    </Layout>
  );
};

export default EpgPage;
