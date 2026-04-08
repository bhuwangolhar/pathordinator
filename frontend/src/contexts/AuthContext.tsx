import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../api/config';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  organization_id: number;
  organization?: {
    id: number;
    name: string;
  };
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const API = API_BASE_URL;
  
  // Log authentication API base URL for debugging
  if (import.meta.env.DEV) {
    console.log('[Auth] API Base URL:', API);
  }

  // Check localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Ensure token is available if not already in localStorage
        if (storedToken) {
          localStorage.setItem('authToken', storedToken);
        }
      } catch (err) {
        console.error('Failed to parse stored user', err);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    const userData = data.data;
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
  };

  const signup = async (name: string, email: string, password: string, organizationName: string) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, organizationName })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Signup failed');
    }

    // After signup, auto-login
    const userData = data.data;
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserId');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
