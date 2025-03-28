import { FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, UserCircle, LogOut, Settings, LayoutDashboard, Home } from 'lucide-react';
import { FuturisticButton } from './FuturisticButton';

const Navbar: FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <motion.header
      className="sticky top-0 z-50 w-full px-6 py-4 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            className="block md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <motion.h1 
              className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              ShortURL
            </motion.h1>
          </Link>
        </div>

        <div className="hidden items-center space-x-8 md:flex">
          <motion.nav 
            className="flex space-x-6" 
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            <NavLink to="/" Icon={Home}>Home</NavLink>
            {user && <NavLink to="/dashboard" Icon={LayoutDashboard}>Dashboard</NavLink>}
            {isAdmin && <NavLink to="/settings" Icon={Settings}>Settings</NavLink>}
          </motion.nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {user ? (
            <div className="relative">
              <motion.button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 rounded-full border border-gray-300 px-3 py-2 dark:border-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserCircle className="h-5 w-5" />
                <span className="hidden text-sm md:inline-block">
                  {user.username}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full">
                      Admin
                    </span>
                  )}
                </span>
              </motion.button>

              {isDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center space-x-2 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link to="/login">
                <FuturisticButton variant="ghost" size="sm">
                  Login
                </FuturisticButton>
              </Link>
              <Link to="/register">
                <FuturisticButton size="sm">
                  Sign Up
                </FuturisticButton>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="mt-4 space-y-2 px-2 pb-4">
            <NavLink to="/" Icon={Home} mobile>Home</NavLink>
            {user && <NavLink to="/dashboard" Icon={LayoutDashboard} mobile>Dashboard</NavLink>}
            {isAdmin && <NavLink to="/settings" Icon={Settings} mobile>Settings</NavLink>}
            {user && (
              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-2 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  Icon?: React.ComponentType<{ className?: string }>;
  mobile?: boolean;
}

function NavLink({ to, children, Icon, mobile = false }: NavLinkProps) {
  const baseClasses = mobile
    ? "flex items-center space-x-2 w-full px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    : "group relative flex items-center space-x-1 text-gray-700 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: -10 },
        show: { opacity: 1, y: 0 }
      }}
    >
      <Link to={to} className={baseClasses}>
        {Icon && <Icon className={mobile ? "h-5 w-5" : "h-4 w-4"} />}
        <span>{children}</span>
        {!mobile && (
          <motion.span
            className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-600 transition-all duration-300 group-hover:w-full dark:bg-blue-400"
            layoutId="navbar-underline"
          />
        )}
      </Link>
    </motion.div>
  );
}

export default Navbar;
