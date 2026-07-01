import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// 인증 페이지
import AuthCallback from './pages/auth/AuthCallback';

// 페이지
import HomePage from './pages/HomePage';

// 시니어 구직자용 페이지
import RegisterPage from './pages/worker/RegisterPage';
import JobsPage from './pages/worker/JobsPage';
import JobDetailPage from './pages/worker/JobDetailPage';
import NotificationsPage from './pages/worker/NotificationsPage';
import MyPage from './pages/worker/MyPage';

// 기업용 페이지
import EmployerSignupPage from './pages/employer/EmployerSignupPage';
import EmployerLoginPage from './pages/employer/EmployerLoginPage';
import EmployerPostPage from './pages/employer/EmployerPostPage';
import EmployerManagePage from './pages/employer/EmployerManagePage';

// 관리자 페이지
import AdminMatchPage from './pages/admin/AdminMatchPage';
import AdminNotifyPage from './pages/admin/AdminNotifyPage';
import AdminEmployerPage from './pages/admin/AdminEmployerPage';

// OAuth 콜백 인터셉터 — 루트로 도착한 ?code= 를 /auth/callback 으로 리다이렉트
const OAuthInterceptor = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    if (code && location.pathname === '/') {
      navigate(`/auth/callback${location.search}`, { replace: true });
    }
  }, [location, navigate]);

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <OAuthInterceptor>
          <Routes>
            {/* 메인 */}
            <Route path="/" element={<HomePage />} />

            {/* 인증 */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* 시니어 구직자 */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/my" element={<MyPage />} />

            {/* 기업 */}
            <Route path="/employer/signup" element={<EmployerSignupPage />} />
            <Route path="/employer/login" element={<EmployerLoginPage />} />
            <Route path="/employer/post" element={<EmployerPostPage />} />
            <Route path="/employer/manage" element={<EmployerManagePage />} />

            {/* 관리자 */}
            <Route path="/admin/match" element={<AdminMatchPage />} />
            <Route path="/admin/notify" element={<AdminNotifyPage />} />
            <Route path="/admin/employers" element={<AdminEmployerPage />} />
          </Routes>
        </OAuthInterceptor>
      </Router>
    </AuthProvider>
  );
}

export default App;
