import { useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: authLogin, signUp: authSignUp, logout: authLogout } = useAuth();

  // Enhanced login function with better error handling for web
  const login = async (email: string, password: string) => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return { success: false };
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return { success: false };
    }

    setError(null);
    setLoading(true);

    try {
      // Log for debugging on web
      if (Platform.OS === 'web' && __DEV__) {
        console.log(`Attempting login with email: ${email}, password length: ${password.length}`);
      }

      const { error: loginError, data } = await authLogin(email, password);
      
      if (loginError) {
        console.error('Login error:', loginError);
        
        // Custom error messages based on error type
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (loginError.message.includes('network')) {
          setError('Network error. Please check your connection and try again.');
        } else if (loginError.message.includes('fetch')) {
          setError('Connection to authentication server failed. Please try again later.');
        } else {
          setError(loginError.message || 'Failed to login');
        }
        
        return { success: false };
      }
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced signup function
  const signUp = async (email: string, password: string) => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return { success: false };
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return { success: false };
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return { success: false };
    }

    setError(null);
    setLoading(true);

    try {
      await authSignUp(email, password);
      return { success: true };
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout function
  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await authLogout();
      return { success: true };
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to logout');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    signUp,
    logout,
    loading,
    error,
    setError,
  };
};

export default useAuthActions; 