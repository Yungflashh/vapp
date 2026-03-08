import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'vendor' | 'customer' | 'admin';
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.log('User data stored:', parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      // Get user data from storage (should be set by login API call)
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
      setIsGuest(false);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const enterGuestMode = () => {
    setIsGuest(true);
    setIsAuthenticated(false);
    setUser(null);
  };

  const exitGuestMode = () => {
    setIsGuest(false);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    AsyncStorage.setItem('userData', JSON.stringify(userData));
  };

  // ✅ Add this new function
  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('✅ User data refreshed:', parsedUser);
        setUser(parsedUser);
        // Force a re-render by updating the state
        setUser(prevUser => ({ ...parsedUser }));
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isGuest,
      user,
      login,
      logout,
      enterGuestMode,
      exitGuestMode,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};