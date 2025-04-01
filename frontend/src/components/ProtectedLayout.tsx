import { FC } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const ProtectedLayout: FC = () => {
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('share_token');

  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated && !shareToken) {
    // Redirect to login page, but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
      <Navbar />
      <main className="pt-16 pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
