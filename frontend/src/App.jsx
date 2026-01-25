import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import CreateQuizPage from './pages/CreateQuizPage';
import AdminContestDashboard from './pages/AdminContestDashboard';
import CreateContestPage from './pages/CreateContestPage';
import ContestLeaderboard from './pages/ContestLeaderboard';
import ContestList from './pages/ContestList';
import ContestPage from './pages/ContestPage';
import UserContestLeaderboard from './pages/UserContestLeaderboard';
import ContestResultPage from './pages/ContestResultPage';
import UserProfile from './pages/UserProfile';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />;
  }

  return children;
};

// Redirect authenticated users away from public routes and / to their dashboard
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const target = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: '600',
              border: '1.5px solid #000000',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #000000',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #000000',
              },
            },
            loading: {
              iconTheme: {
                primary: '#0f172a',
                secondary: '#ffffff',
              },
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #000000',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={(
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            )}
          />
          <Route
            path="/register"
            element={(
              <AuthRedirect>
                <Register />
              </AuthRedirect>
            )}
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-quiz"
            element={
              <ProtectedRoute allowedRole="admin">
                <CreateQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contests"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminContestDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contest/create"
            element={
              <ProtectedRoute allowedRole="admin">
                <CreateContestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contest/edit/:contestId"
            element={
              <ProtectedRoute allowedRole="admin">
                <CreateContestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contest/:contestId/leaderboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <ContestLeaderboard />
              </ProtectedRoute>
            }
          />


          {/* User Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:quizId"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result/:resultId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contests"
            element={
              <ProtectedRoute>
                <ContestList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contest/:contestId"
            element={
              <ProtectedRoute>
                <ContestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contest/:contestId/leaderboard"
            element={
              <ProtectedRoute>
                <UserContestLeaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contest/result/:resultId"
            element={
              <ProtectedRoute>
                <ContestResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRole="user">
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route
            path="/"
            element={(
              <AuthRedirect>
                <Navigate to="/login" replace />
              </AuthRedirect>
            )}
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App
