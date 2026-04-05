import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router';

import Home from './components/Home';
import NotFound from './components/NotFound';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
