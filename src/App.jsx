import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import TournamentList from './pages/tournaments/TournamentList';
import TournamentDetails from './pages/tournaments/TournamentDetails';
import MatchSchedule from './pages/MatchSchedule';
import Sponsors from './pages/Sponsors';
import QRScanner from './pages/QRScanner';
import MVPStats from './pages/MVPStats';

// Protected pages
import PlayerDashboard from './pages/player/PlayerDashboard';
import PlayerProfile from './pages/player/PlayerProfile';
import DigitalIDCard from './pages/player/DigitalIDCard';
import CaptainDashboard from './pages/captain/CaptainDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Loader fullscreen />;

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/tournaments" element={<TournamentList />} />
          <Route path="/tournaments/:id" element={<TournamentDetails />} />
          <Route path="/schedule" element={<MatchSchedule />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/scanner" element={<QRScanner />} />
          <Route path="/mvp-stats" element={<MVPStats />} />

          {/* Player */}
          <Route path="/player" element={<ProtectedRoute allowedRoles={['player', 'captain', 'admin']} />}>
            <Route path="dashboard" element={<PlayerDashboard />} />
            <Route path="profile" element={<PlayerProfile />} />
            <Route path="id-card" element={<DigitalIDCard />} />
          </Route>

          {/* Captain */}
          <Route path="/captain" element={<ProtectedRoute allowedRoles={['captain', 'admin']} />}>
            <Route path="dashboard" element={<CaptainDashboard />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
