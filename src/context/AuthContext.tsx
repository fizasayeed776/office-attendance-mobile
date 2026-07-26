import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { tokenStorage } from '../api/client';

export type Employee = {
  pk: number;
  employee_id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  username: string;
  shift_name?: string;
};

export type AdminUser = {
  pk: number;
  username: string;
  name: string;
  staff_role: string;
  staff_department: string;
};

type AuthContextValue = {
  loading: boolean;
  employee: Employee | null;
  adminUser: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const restoreSession = useCallback(async () => {
    const token = await tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      // /api/mobile/dashboard/ doubles as a "who am I" check -- if the
      // stored token is stale/revoked, this fails and we fall back to login.
      const { data } = await api.get('/api/mobile/dashboard/');
      setEmployee(data.employee);
      setAdminUser(null);
    } catch {
      await tokenStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post('/api/mobile/login/', {
      username,
      password,
      device_label: 'React Native app',
    });
    await tokenStorage.set(data.token);
    if (data.role === 'admin') {
      setAdminUser({
        pk: data.pk,
        username: data.username,
        name: data.name,
        staff_role: data.staff_role,
        staff_department: data.staff_department,
      });
      setEmployee(null);
    } else {
      setEmployee(data.employee);
      setAdminUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/mobile/logout/');
    } catch {
      // Even if the network call fails, we still want to forget the token locally.
    }
    await tokenStorage.clear();
    setEmployee(null);
    setAdminUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ loading, employee, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
