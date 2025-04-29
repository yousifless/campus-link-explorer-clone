
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  Home, 
  Users, 
  User, 
  MessageSquare, 
  Menu, 
  X,
  Bell,
  Coffee,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/contexts/ProfileContext';
import { Logo } from '@/components/ui/logo';

const Navbar = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = isAuthenticated
    ? [
        { path: '/', label: 'Home', icon: <Home size={20} /> },
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/feed', label: 'Feed', icon: <Users size={20} /> },
        { path: '/matches', label: 'Matches', icon: <Users size={20} /> },
        { path: '/chat', label: 'Chat', icon: <MessageSquare size={20} /> },
        { path: '/meetups', label: 'Meetups', icon: <Coffee size={20} /> },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
      ]
    : [
        { path: '/', label: 'Home', icon: <Home size={20} /> },
        { path: '/login', label: 'Login', icon: null },
        { path: '/signup', label: 'Sign Up', icon: null },
      ];

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.05 * i,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled 
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md" 
          : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Logo size="md" className="mr-4" />
        
        {/* Mobile menu button */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="relative">
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 mx-6">
          {navItems.map((item, i) => (
            <motion.div
              key={item.path}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={navItemVariants}
            >
              <Link
                to={item.path}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 relative group",
                  isActive(item.path)
                    ? "text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-brand-purple dark:hover:text-brand-light hover:bg-gray-100 dark:hover:bg-gray-800/30"
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-full ring-2 ring-brand-purple/30 dark:ring-brand-light/20"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
          {isAuthenticated && <NotificationCenter />}
        </nav>

        {/* Mobile nav */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm md:hidden">
            <nav className="container grid gap-y-4 px-4 py-6">
              {navItems.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  key={item.path}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg text-base font-medium transition-colors",
                      isActive(item.path)
                        ? "text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:text-brand-purple"
                    )}
                    onClick={closeMenu}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              {isAuthenticated && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: navItems.length * 0.05 }}
                    className="flex items-center space-x-3 text-base font-medium"
                  >
                    <NotificationCenter />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: (navItems.length + 1) * 0.05 }}
                  >
                    <Button 
                      variant="destructive" 
                      className="mt-4 w-full" 
                      onClick={() => {
                        signOut();
                        closeMenu();
                      }}
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                </>
              )}
            </nav>
          </div>
        )}

        <div className="hidden md:flex flex-1 items-center justify-end">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {profile && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-brand-purple/30 transition-all duration-300">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-brand-purple to-brand-pink text-white">
                      {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline">{profile.first_name}</span>
                </motion.div>
              )}
              <Button 
                variant="outline" 
                onClick={signOut}
                className="border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-dark dark:border-brand-light/20 dark:text-brand-light dark:hover:bg-brand-dark/20"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-brand-purple dark:text-gray-300 dark:hover:text-brand-light">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-brand-purple to-brand-pink hover:shadow-lg transition-all duration-300 text-white">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
