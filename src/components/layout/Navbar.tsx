
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  Home, 
  Users, 
  User, 
  MessageSquare, 
  Bell, 
  Menu, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { isAuthenticated, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = isAuthenticated
    ? [
        { path: '/', label: 'Home', icon: <Home size={20} /> },
        { path: '/feed', label: 'Discover', icon: <Users size={20} /> },
        { path: '/matches', label: 'Matches', icon: <Users size={20} /> },
        { path: '/chat', label: 'Messages', icon: <MessageSquare size={20} /> },
        { 
          path: '/notifications', 
          label: 'Notifications', 
          icon: <Bell size={20} />,
          badge: unreadCount > 0 ? unreadCount : null 
        },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
      ]
    : [
        { path: '/', label: 'Home', icon: <Home size={20} /> },
        { path: '/login', label: 'Login', icon: null },
        { path: '/signup', label: 'Sign Up', icon: null },
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Link to="/" className="flex items-center space-x-2 mr-4" onClick={closeMenu}>
          <span className="font-bold text-xl">CampusLink</span>
        </Link>

        {/* Mobile menu button */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary",
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile nav */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-background md:hidden">
            <nav className="container grid gap-y-4 px-4 py-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 text-base font-medium transition-colors hover:text-primary",
                    isActive(item.path)
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={closeMenu}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
              {isAuthenticated && (
                <Button 
                  variant="destructive" 
                  className="mt-4" 
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                >
                  Sign Out
                </Button>
              )}
            </nav>
          </div>
        )}

        <div className="hidden md:flex flex-1 items-center justify-end">
          {isAuthenticated ? (
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
