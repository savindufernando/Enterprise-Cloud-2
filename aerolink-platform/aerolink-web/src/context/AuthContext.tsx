import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'airline_operator' | 'ground_staff' | 'passenger';
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  loginAs: (role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API = `${API_BASE}/api/v1/passengers`;

function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('aerolink_token');
    const savedUser = localStorage.getItem('aerolink_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const persistSession = (t: string, u: User) => {
    localStorage.setItem('aerolink_token', t);
    localStorage.setItem('aerolink_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Login failed');
    }
    const data = await res.json();
    const decoded = decodeJwt(data.access_token);
    const u: User = {
      id: decoded?.sub || '',
      email,
      role: decoded?.role || 'passenger',
    };
    persistSession(data.access_token, u);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Registration failed');
    }
    const data = await res.json();
    const decoded = decodeJwt(data.access_token);
    const u: User = {
      id: decoded?.sub || '',
      email,
      role: decoded?.role || 'passenger',
      firstName,
      lastName,
    };
    persistSession(data.access_token, u);
  };

  // Quick demo login — creates a mock session for staff roles without hitting the API
  const loginAs = (role: string) => {
    const mockUser: User = {
      id: 'demo-' + role,
      email: `${role}@aerolink.io`,
      role: role as User['role'],
      firstName: role === 'admin' ? 'System' : role === 'airline_operator' ? 'Flight' : 'Gate',
      lastName: role === 'admin' ? 'Admin' : role === 'airline_operator' ? 'Operator' : 'Agent',
    };
    const mockToken = 'demo.' + btoa(JSON.stringify({ sub: mockUser.id, role })) + '.mock';
    persistSession(mockToken, mockUser);
  };

  const logout = () => {
    localStorage.removeItem('aerolink_token');
    localStorage.removeItem('aerolink_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginAs, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
