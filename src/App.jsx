import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ScrollToTop from './components/common/ScrollToTop';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import AdminLayout from './components/common/AdminLayout';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/admin/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import TournamentList from './pages/tournaments/TournamentList';
import TournamentDetails from './pages/tournaments/TournamentDetails';
import MatchSchedule from './pages/MatchSchedule';
import Sponsors from './pages/Sponsors';
import QRScanner from './pages/QRScanner';
import MVPStats from './pages/MVPStats';
import Organize from './pages/organize/Organize';
import TournamentTypeDetails from './pages/tournaments/TournamentTypeDetails';

// Protected pages
import PlayerDashboard from './pages/player/PlayerDashboard';
import PlayerProfile from './pages/player/PlayerProfile';
import DigitalIDCard from './pages/player/DigitalIDCard';
import CaptainDashboard from './pages/captain/CaptainDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminTeams from './pages/admin/AdminTeams';
import AdminMatches from './pages/admin/AdminMatches';
import AdminImages from './pages/admin/AdminImages';
import AdminTournaments from './pages/admin/AdminTournaments';

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <Loader fullscreen />;

  const isAdminPath = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <>
      <ScrollToTop />
      {!isAdminPath && <Navbar />}
      <main className={isAdminPath ? "admin-page-wrapper" : "page-wrapper"}>
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
          <Route path="/tournaments/type/:typeId" element={<TournamentTypeDetails />} />
          <Route path="/schedule" element={<MatchSchedule />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/scanner" element={<QRScanner />} />
          <Route path="/mvp-stats" element={<MVPStats />} />
          <Route path="/organize" element={<Organize />} />

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

          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<Navigate to="/admin/login" replace />} />

          {/* Admin Routes wrapped in AdminLayout */}
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/players" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminPlayers />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/teams" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminTeams />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/matches" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminMatches />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/images" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminImages />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/tournaments" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminTournaments />
              </AdminLayout>
            </AdminProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
    </>
  );
}

