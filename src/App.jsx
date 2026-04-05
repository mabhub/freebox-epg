import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router';

import EpgPage from './components/epg/EpgPage';
import NotFound from './components/NotFound';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<EpgPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
