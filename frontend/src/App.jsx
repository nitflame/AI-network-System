import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Monitor from './pages/Monitor';
import Predict from './pages/Predict';
import Slicing from './pages/Slicing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="predict" element={<Predict />} />
          <Route path="slicing" element={<Slicing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
