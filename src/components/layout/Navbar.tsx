
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Bell, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 py-3">
      <div className="campus-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-campus-blue flex items-center justify-center">
                <span className="text-white font-bold text-lg">CL</span>
              </div>
              <span className="text-xl font-bold text-campus-blue">CampusLink</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-campus-blue font-medium">Home</Link>
            <Link to="/feed" className="text-gray-700 hover:text-campus-blue font-medium">Feed</Link>
            <Link to="/events" className="text-gray-700 hover:text-campus-blue font-medium">Events</Link>
            <Link to="/groups" className="text-gray-700 hover:text-campus-blue font-medium">Groups</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </Button>
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative" size="icon">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Profile" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-gray-700 hover:text-campus-blue font-medium py-2" onClick={toggleMenu}>
                Home
              </Link>
              <Link to="/feed" className="text-gray-700 hover:text-campus-blue font-medium py-2" onClick={toggleMenu}>
                Feed
              </Link>
              <Link to="/events" className="text-gray-700 hover:text-campus-blue font-medium py-2" onClick={toggleMenu}>
                Events
              </Link>
              <Link to="/groups" className="text-gray-700 hover:text-campus-blue font-medium py-2" onClick={toggleMenu}>
                Groups
              </Link>
              <div className="pt-3 border-t border-gray-200">
                {isLoggedIn ? (
                  <div className="flex flex-col space-y-3">
                    <Link to="/profile" className="text-gray-700 hover:text-campus-blue font-medium py-2" onClick={toggleMenu}>
                      Profile
                    </Link>
                    <Link to="/settings" className="text-gray-700 hover:text-campus-blue font-medium py-2" onClick={toggleMenu}>
                      Settings
                    </Link>
                    <Button variant="outline" className="justify-start" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <Link to="/login" onClick={toggleMenu}>
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link to="/signup" onClick={toggleMenu}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
