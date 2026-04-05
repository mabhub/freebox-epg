import { Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router';

import Layout from './Layout';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h1" color="text.secondary" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          Page introuvable
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
      </Box>
    </Layout>
  );
};

export default NotFound;
