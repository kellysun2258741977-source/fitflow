import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import DockNav from './components/DockNav';
import OverviewPage from './pages/OverviewPage';
import LogPage from './pages/LogPage';
import ReportsPage from './pages/ReportsPage';
import ResourcesPage from './pages/ResourcesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext'; // 导入 useAuth 钩子
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  const { isAuthenticated, logout, bootstrapping, user } = useAuth(); // 获取认证状态和 logout 函数
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (bootstrapping) {
    return ( // Basic loading indicator
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      {!isAuthPage ? <Header isAuthenticated={isAuthenticated} onLogout={logout} user={user} /> : null}
      <main className={isAuthPage ? 'flex-grow' : 'flex-grow pb-24'}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <OverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute>
                <LogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isAuthPage && isAuthenticated ? <DockNav /> : null}
    </div>
  );
}

export default App;
