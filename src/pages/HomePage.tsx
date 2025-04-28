import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to CampusLink</h1>
      <p className="text-lg mb-8">
        Connect with fellow students, find study partners, and make new friends on campus.
      </p>
      
      {!user ? (
        <div className="space-x-4">
          <Link to="/login">
            <Button>Login</Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      ) : (
        <div className="space-x-4">
          <Link to="/matches">
            <Button>Find Matches</Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline">View Profile</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage; 