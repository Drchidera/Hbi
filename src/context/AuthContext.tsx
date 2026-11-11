import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Notification } from '../types';
import { api, getStoredToken, setStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsAdminSetup: boolean;
  notifications: Notification[];
  unreadNotifsCount: number;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<{ user: User; demoVerificationCode?: string }>;
  logout: () => void;
  verifyEmail: (code: string) => Promise<void>;
  updateProfile: (data: { fullName?: string; phone?: string; countryOfResidence?: string }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  checkAdminSetup: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsAdminSetup, setNeedsAdminSetup] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const checkAdminSetup = useCallback(async () => {
    try {
      const res = await api.checkAdminSetupStatus();
      setNeedsAdminSetup(res.needsSetup);
      return res.needsSetup;
    } catch (e) {
      console.error('Failed to check admin setup status', e);
      return false;
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (e) {
      // ignore token error
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
      await refreshNotifications();
    } catch (e) {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    checkAdminSetup();
    refreshUser();
  }, [checkAdminSetup, refreshUser]);

  // Polling for updates every 15 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    setUser(res.user);
    await refreshNotifications();
    return res.user;
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setUser(res.user);
    await refreshNotifications();
    return res;
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setNotifications([]);
  };

  const verifyEmail = async (code: string) => {
    const res = await api.verifyEmail(code);
    if (res.user) setUser(res.user);
  };

  const updateProfile = async (data: { fullName?: string; phone?: string; countryOfResidence?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await api.changePassword(data);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsAdminSetup,
        notifications,
        unreadNotifsCount,
        login,
        register,
        logout,
        verifyEmail,
        updateProfile,
        changePassword,
        refreshUser,
        refreshNotifications,
        checkAdminSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
