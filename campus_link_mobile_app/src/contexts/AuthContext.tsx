import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Alert } from 'react-native';

// Define the user type
export interface User {
  id: string;
  email: string;
}

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({ error: null, data: null }),
  signUp: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error.message);
          setError(error.message);
          setLoading(false);
          return;
        }
        
        if (data?.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
          });
        }
      } catch (err: any) {
        console.error('Auth error:', err.message);
        setError(err.message || 'Unknown authentication error');
      } finally {
        setLoading(false);
      }
    };

    // Try to check session and handle potential errors
    try {
      checkSession();
      
      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state changed:', event);
          
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      // Clean up subscription
      return () => {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    } catch (err: any) {
      console.error('Auth setup error:', err.message);
      setError(err.message || 'Failed to setup authentication');
      setLoading(false);
    }
  }, []);

  // Login method
  const login = async (email: string, password: string): Promise<{ error: any; data: any }> => {
    try {
      setLoading(true);
      
      // Validate inputs
      if (!email || !password) {
        console.error('Email and password are required');
        return { error: { message: 'Email and password are required' }, data: null };
      }
      
      // Validate supabase client is properly initialized
      if (!supabase?.auth) {
        console.error('Supabase client not properly initialized');
        return { error: { message: 'Authentication service unavailable' }, data: null };
      }

      // Attempt login with better error handling
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return { error, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Login error:', err);
      return { error: { message: err.message || 'An unexpected error occurred' }, data: null };
    } finally {
      setLoading(false);
    }
  };

  // Sign up method
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Note: Supabase might require email confirmation
      // In that case, user won't be set immediately
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }
    } catch (err: any) {
      console.error('Signup error:', err.message);
      setError(err.message || 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout method
  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err.message);
      setError(err.message || 'Failed to logout');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password method
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Password reset error:', err.message);
      setError(err.message || 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Provide the context value
  const value = {
    user,
    loading,
    error,
    login,
    signUp,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 