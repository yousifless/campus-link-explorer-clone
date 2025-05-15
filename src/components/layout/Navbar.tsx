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
  LayoutDashboard,
  Calendar,
  UsersRound,
  ChevronsUpDown,
  Gift,
  LogIn,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/contexts/ProfileContext';

// Define types for navigation items
interface NavItemBase {
  label: string;
  icon?: React.ReactNode;
}

interface SimpleNavItem extends NavItemBase {
  path: string;
  group?: never;
  items?: never;
}

interface GroupNavItem extends NavItemBase {
  path?: never;
  group: string;
  items: { path: string; label: string }[];
}

type NavItem = SimpleNavItem | GroupNavItem;

const Navbar = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [clubsDropdownOpen, setClubsDropdownOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;
  const isActiveGroup = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = isAuthenticated
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { 
          group: 'clubs',
          label: 'Clubs', 
          icon: <UsersRound size={20} />,
          items: [
            { path: '/clubs', label: 'Browse Clubs' },
            { path: '/clubs/calendar', label: 'Club Calendar' },
          ]
        },
        { path: '/matches', label: 'Matches', icon: <Users size={20} /> },
        { path: '/feed', label: 'Smart Matching', icon: <UserPlus size={20} /> },
        { path: '/messages', label: 'Messages', icon: <MessageSquare size={20} /> },
        { path: '/events', label: 'Events', icon: <Calendar size={20} /> },
        { path: '/meetups', label: 'Meetups', icon: <Coffee size={20} /> },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
        { path: '/referrals', label: 'Referrals', icon: <Gift size={20} /> },
      ]
    : [
        { path: '/', label: 'Home', icon: <Home size={20} /> },
        { path: '/login', label: 'Login', icon: <LogIn size={20} /> },
        { path: '/signup', label: 'Signup', icon: <UserPlus size={20} /> },
      ];

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled 
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md" 
          : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Link to="/" className="flex items-center space-x-2 mr-4" onClick={closeMenu}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Coffee className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CampusLink</span>
        </Link>

        {/* Mobile menu button */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="relative">
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 mx-6">
          {navItems.map((item) => 
            item.group ? (
              <div className="relative" key={item.group}>
                <div
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
                    isActiveGroup(item.items?.map(i => i.path) || [])
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  )}
                  onClick={() => setClubsDropdownOpen(!clubsDropdownOpen)}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                  <ChevronsUpDown className="h-4 w-4 ml-1" />
                </div>
                
                {clubsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={cn(
                            "flex items-center px-4 py-2 text-sm",
                            isActive(subItem.path)
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                          onClick={() => setClubsDropdownOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-colors relative group",
                  isActive(item.path)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-full ring-2 ring-blue-400/30 dark:ring-blue-500/20"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </Link>
            )
          )}
          {isAuthenticated && <NotificationCenter />}
        </nav>

        {/* Mobile nav */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm md:hidden">
            <nav className="container grid gap-y-4 px-4 py-6">
              {navItems.map((item) => 
                item.group ? (
                  <div key={item.group} className="space-y-1">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg text-base font-medium transition-colors",
                          isActiveGroup(item.items?.map(i => i.path) || [])
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                        onClick={() => setClubsDropdownOpen(!clubsDropdownOpen)}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon && <span>{item.icon}</span>}
                          <span>{item.label}</span>
                        </div>
                        <ChevronsUpDown className="h-4 w-4" />
                      </div>
                    </motion.div>
                    
                    {clubsDropdownOpen && item.items?.map((subItem, index) => (
                      <motion.div
                        key={subItem.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: 0.05 * index }}
                      >
                        <Link
                          to={subItem.path}
                          className={cn(
                            "flex items-center pl-10 pr-4 py-2 rounded-lg text-sm transition-colors",
                            isActive(subItem.path)
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                          )}
                          onClick={closeMenu}
                        >
                          {subItem.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    key={item.path}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg text-base font-medium transition-colors",
                        isActive(item.path)
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                          : "text-gray-600 dark:text-gray-400"
                      )}
                      onClick={closeMenu}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                )
              )}
              {isAuthenticated && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: navItems.length * 0.05 }}
                    className="flex items-center space-x-3 text-base font-medium"
                  >
                    <NotificationCenter />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: (navItems.length + 1) * 0.05 }}
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
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                      {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline">{profile.first_name}</span>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={signOut}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close dropdowns */}
      {clubsDropdownOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setClubsDropdownOpen(false)}
        />
      )}
    </motion.header>
  );
};

export default Navbar;
