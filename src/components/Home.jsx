import { useState } from 'react';
import {
  Button,
  Typography,
  Box,
  Paper,
} from '@mui/material';

import Layout from './Layout';

/**
 * Home page component with a simple counter example
 *
 * @returns {React.ReactElement} Home page content
 */
const Home = () => {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
  };

  return (
    <Layout>
      <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Vite + React + MUI
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Template de démarrage avec les dernières technologies
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Technologies incluses :
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            • React 19 avec hooks modernes<br />
            • Material-UI v7 avec thème personnalisé et mode sombre<br />
            • TanStack Query v5 pour la gestion des données<br />
            • React Router v7 pour la navigation<br />
            • Vite 8 pour un développement ultra-rapide<br />
            • Oxlint pour l'analyse de code rapide
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Button
            onClick={handleIncrement}
            variant="contained"
            size="large"
            sx={{ mr: 2 }}
          >
            Compteur : {count}
          </Button>
          <Button
            onClick={() => setCount(0)}
            variant="outlined"
            size="large"
            disabled={count === 0}
          >
            Reset
          </Button>
        </Box>
      </Paper>
    </Layout>
  );
};

export default Home;
