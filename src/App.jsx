import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentUser } from './store/slices/userSlice';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import JinnarChallenge from './pages/JinnarChallenge';
import FAQ from './pages/FAQ';
import Rules from './pages/Rules';
import Leaderboards from './pages/Leaderboards';
import Winners from './pages/Winners';
import Announcements from './pages/Announcements';
import MediaHighlights from './pages/MediaHighlights';
import PastWinners from './pages/PastWinners';
import UserDashboard from './pages/UserDashboard';
import UploadVideo from './pages/UploadVideo';
import SubmitPostLink from './pages/SubmitPostLink';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import VerifyAccount from './pages/VerifyAccount';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDraws from './pages/admin/AdminDraws';
import CreateDraw from './pages/admin/CreateDraw';
import EditDraw from './pages/admin/EditDraw';
import ManageRewards from './pages/admin/ManageRewards';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import DrawParticipants from './pages/admin/DrawParticipants';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFinances from './pages/admin/AdminFinances';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import { ToastProvider } from './contexts/ToastContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import ApiTest from './pages/ApiTest';
import { Toaster } from 'react-hot-toast';



// RouterLayout: must be a child of <Router> to use useLocation
// Must also be a descendant of CurrencyProvider — guaranteed since App wraps both
const RouterLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);
  const isAdminPage = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // Load the full profile (name, city, country, mobileNumber, role, ...) once we know
  // we're authenticated — the JWT itself only carries { id, role }.
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
        {/* Backward compat */}
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/challenge" element={<JinnarChallenge />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/winners" element={<Winners />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/media" element={<MediaHighlights />} />
        <Route path="/past-winners" element={<PastWinners />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify" element={<VerifyAccount />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadVideo /></ProtectedRoute>} />
        <Route path="/submit-link" element={<ProtectedRoute><SubmitPostLink /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/finances" element={<AdminRoute><AdminFinances /></AdminRoute>} />
        <Route path="/admin/draws" element={<AdminRoute><AdminDraws /></AdminRoute>} />
        <Route path="/admin/draws/create" element={<AdminRoute><CreateDraw /></AdminRoute>} />
        <Route path="/admin/draws/edit/:id" element={<AdminRoute><EditDraw /></AdminRoute>} />
        <Route path="/admin/draws/:id/rewards" element={<AdminRoute><ManageRewards /></AdminRoute>} />
        <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissions /></AdminRoute>} />

        <Route path="/admin/participants" element={<AdminRoute><DrawParticipants /></AdminRoute>} />
        <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />

        {/* Dev */}
        <Route path="/api-test" element={<ApiTest />} />
      </Routes>
      {!isAdminPage && <Footer />}
    </>
  );
};

function App() {
  return (
    <CurrencyProvider>
      <ToastProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Router>
          <RouterLayout />
        </Router>
      </ToastProvider>
    </CurrencyProvider>
  );
}

export default App;
