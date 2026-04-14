import React, { createContext, useCallback, useEffect, useContext, useMemo, useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const guestCreds = useMemo(() => {
    try {
      const raw = localStorage.getItem('guestCreds');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.email || !parsed?.password) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [accessToken]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    navigate('/login');
  }, [navigate]);

  const setSessionFromToken = useCallback(
    async (token) => {
      setAccessToken(token);
      localStorage.setItem('accessToken', token);
      const currentUser = await authService.getCurrentUser(token);
      setUser(currentUser);
    },
    []
  );

  const loginGuest = useCallback(async () => {
    const existing = guestCreds;
    const makeCreds = () => {
      const rnd = Math.random().toString(16).slice(2);
      const email = `guest_${Date.now()}_${rnd}@example.com`;
      const password = `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      const creds = { email, password };
      localStorage.setItem('guestCreds', JSON.stringify(creds));
      return creds;
    };

    const creds = existing || makeCreds();
    try {
      const tokenRes = await authService.loginUser(creds);
      await setSessionFromToken(tokenRes.access_token);
      navigate('/');
      return true;
    } catch (e) {
      const msg = e?.message || '';
      const shouldRegister = msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('not validate') || msg.toLowerCase().includes('unexpected') || msg.toLowerCase().includes('422');
      if (!shouldRegister) throw e;
    }

    try {
      await authService.registerUser({
        email: creds.email,
        password: creds.password,
        height: 170,
        weight: 70,
        age: 25,
        gender: 'male',
        activity_level_factor: 1.2,
      });
    } catch (e) {
      const msg = e?.message || '';
      if (!msg.toLowerCase().includes('already')) {
        throw e;
      }
    }

    const tokenRes = await authService.loginUser(creds);
    await setSessionFromToken(tokenRes.access_token);
    navigate('/');
    return true;
  }, [guestCreds, setSessionFromToken, navigate]);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        if (accessToken) {
          const currentUser = await authService.getCurrentUser(accessToken);
          if (!active) return;
          setUser(currentUser);
        }
      } catch (error) {
        if (!active) return;
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
      } finally {
        if (!active) return;
        setBootstrapping(false);
      }
    };

    loadUser();
    return () => {
      active = false;
    };
  }, [accessToken, logout]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.loginUser({ email, password });
      await setSessionFromToken(response.access_token);
      navigate('/'); // Redirect to home after login
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authService.registerUser(userData);
      // Optionally, log in the user immediately after registration
      // await login(userData.email, userData.password);
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{ user, accessToken, isAuthenticated, bootstrapping, loading, login, loginGuest, register, logout }}>
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
