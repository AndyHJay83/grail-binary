
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FilterPage from './pages/FilterPage';
import SettingsPage from './pages/SettingsPage';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/filter" element={<FilterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App; // Force new build 1752750979
