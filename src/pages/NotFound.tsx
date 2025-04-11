
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HomeIcon } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-3xl font-semibold mt-6 mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button size="lg">
          <HomeIcon className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
