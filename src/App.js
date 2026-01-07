import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// 인증 페이지
import LoginPage from './pages/auth/LoginPage';
import AuthCallback from './pages/auth/AuthCallback';
import SelectRolePage from './pages/auth/SelectRolePage';

// 기존 페이지
import LandingPage from './pages/LandingPage';

// 시니어 구직자용 페이지
import RegisterPage from './pages/worker/RegisterPage';
import JobsPage from './pages/worker/JobsPage';
import JobDetailPage from './pages/worker/JobDetailPage';
import MyPage from './pages/worker/MyPage';

// 기업용 페이지
import EmployerPostPage from './pages/employer/EmployerPostPage';
import EmployerManagePage from './pages/employer/EmployerManagePage';

// 관리자 페이지
import AdminMatchPage from './pages/admin/AdminMatchPage';
import AdminNotifyPage from './pages/admin/AdminNotifyPage';
import AdminEmployerPage from './pages/admin/AdminEmployerPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 메인 */}
          <Route path="/" element={<LandingPage />} />

          {/* 인증 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/select-role" element={<SelectRolePage />} />

          {/* 시니어 구직자 */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/my" element={<MyPage />} />

          {/* 기업 */}
          <Route path="/employer/post" element={<EmployerPostPage />} />
          <Route path="/employer/manage" element={<EmployerManagePage />} />

          {/* 관리자 */}
          <Route path="/admin/match" element={<AdminMatchPage />} />
          <Route path="/admin/notify" element={<AdminNotifyPage />} />
          <Route path="/admin/employers" element={<AdminEmployerPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
