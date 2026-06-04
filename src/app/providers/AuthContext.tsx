import React, { createContext, useContext, useState, useEffect } from 'react';
import type { JwtPayload, UserContextData } from '../../shared/types/auth.types';

interface AuthContextType {
  user: UserContextData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode a JWT payload without an external library
const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When the app starts, check if a token already exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('salonApplicationToken');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({
          username: decoded.sub,
          userId: Number(decoded.sub), // JWT subject is the userId
          orgId: decoded.orgId,
          role: decoded.role,
        });
      } else {
        // Token is expired or invalid
        localStorage.removeItem('salonApplicationToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('salonApplicationToken', token);
    const decoded = decodeJwt(token);
    if (decoded) {
      setUser({
        username: decoded.sub,
        userId: Number(decoded.sub), // JWT subject is the userId
        orgId: decoded.orgId,
        role: decoded.role,
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('salonApplicationToken');
    setUser(null);
    window.location.href = '/login'; // Redirect to login
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext easily in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
