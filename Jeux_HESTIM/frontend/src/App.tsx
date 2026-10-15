import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardEnseignant from './pages/DashboardEnseignant';
import DatabasePage from './pages/DatabasePage';
import AdminHomePage from './pages/AdminHomePage';
import ParticipantHomePage from './pages/ParticipantHomePage';
import GameSessionPage from './pages/GameSessionPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/participant" element={<ParticipantHomePage />} />
        <Route path="/session/:sessionId" element={<GameSessionPage />} />
        <Route path="/admin" element={<AdminHomePage />} />
        <Route path="/dashboard" element={<DashboardEnseignant />} />
        <Route path="/database" element={<DatabasePage />} />
      </Routes>
    </Router>
  );
}

export default App;
