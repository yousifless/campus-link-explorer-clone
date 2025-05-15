import React from 'react';
import { motion } from 'framer-motion';
import NewClubForm from '@/components/clubs/NewClubForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const NewClubPage = () => {
  const { user } = useAuth();
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold mb-2">Create a New Club</h1>
        <p className="text-muted-foreground">
          Create your own club to connect with fellow students who share your interests
        </p>
      </motion.div>
      
      <NewClubForm />
    </div>
  );
};

export default NewClubPage; 