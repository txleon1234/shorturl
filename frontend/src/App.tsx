import { FC, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UrlStats from './pages/UrlStats';
import Settings from './pages/Settings';

// Components
import ProtectedLayout from './components/ProtectedLayout';
import AdminRoute from './components/AdminRoute';

// Create a client for React Query
const queryClient = new QueryClient();

const App: FC = () => {
  // 初始化主题
  useEffect(() => {
    // 检查localStorage中的主题设置
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 如果已保存设置则使用它，否则根据系统偏好
    const isDark = savedTheme ? ['dark', 'night', 'cyberpunk', 'synthwave'].includes(savedTheme) : prefersDark;
    
    // 应用主题设置
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', savedTheme || 'dark');
      document.body.style.backgroundColor = '#1f2937';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', savedTheme || 'light');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen"
            >
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/stats/:shortCode" element={<UrlStats />} />
                  
                  {/* Admin routes */}
                  <Route path="/settings" element={
                    <AdminRoute>
                      <Settings />
                    </AdminRoute>
                  } />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
