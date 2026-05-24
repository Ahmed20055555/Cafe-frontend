'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getMe } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('cafe_token');
    if (token) {
      try {
        const res = await getMe();
        setUser(res.data.data);
      } catch {
        localStorage.removeItem('cafe_token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    const { token, ...userData } = res.data.data;
    localStorage.setItem('cafe_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('cafe_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
