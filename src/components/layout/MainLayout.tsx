
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <motion.main 
        className="flex-grow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children || <Outlet />}
      </motion.main>
      <Footer />
      
      {/* Background decorative elements */}
      <div className="fixed top-0 right-0 w-1/3 h-screen pointer-events-none overflow-hidden z-0 opacity-30 dark:opacity-10">
        <div className="absolute top-0 right-0 w-full h-full bg-blue-200 dark:bg-blue-700 rounded-bl-full transform translate-x-1/2 -translate-y-1/4"></div>
      </div>
      <div className="fixed bottom-0 left-0 w-1/4 h-screen pointer-events-none overflow-hidden z-0 opacity-30 dark:opacity-10">
        <div className="absolute bottom-0 left-0 w-full h-full bg-indigo-200 dark:bg-indigo-700 rounded-tr-full transform -translate-x-1/2 translate-y-1/4"></div>
      </div>
    </div>
  );
};

export default MainLayout;
