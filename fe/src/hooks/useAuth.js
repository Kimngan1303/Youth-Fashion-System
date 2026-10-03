import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom Hook to easily access AuthContext state and functions
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
