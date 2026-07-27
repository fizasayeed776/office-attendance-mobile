import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
    console.log('AuthContext.restoreSession start');
    const token = await tokenStorage.get();
    if (!token) {
      console.log('AuthContext.restoreSession no token found');
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/api/session/');
      console.log('AuthContext.restoreSession session response', data);
      if (data.role === 'admin') {
        setAdminUser({
          pk: data.pk,
          username: data.username,
          name: data.name,
          staff_role: data.staff_role,
          staff_department: data.staff_department,
        });
        setEmployee(null);
      } else if (data.role === 'employee' && data.employee_pk) {
        setEmployee({
          pk: data.employee_pk,
          employee_id: data.employee_id,
          name: data.name,
          department: data.department,
          designation: '',
          email: '',
          phone: '',
          username: data.username,
        });
        setAdminUser(null);
      } else {
        console.log('AuthContext.restoreSession unauthenticated or unexpected session response', data);
        await tokenStorage.clear();
        setEmployee(null);
        setAdminUser(null);
      }
    } catch (err) {
      console.error('AuthContext.restoreSession failed', err);
      await tokenStorage.clear();
      setEmployee(null);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (username: string, password: string) => {
    console.log('AuthContext.login start', { username });
    try {
      const { data } = await api.post('/api/mobile/login/', {
        username,
        password,
        device_label: 'React Native app',
      });
      console.log('AuthContext.login response', data);
      await tokenStorage.set(data.token);
      if (data.role === 'admin') {
        if (!data.pk || !data.username) {
          console.error('AuthContext.login admin response missing expected fields', data);
          throw new Error('Unexpected admin login response from server.');
        }
        setAdminUser({
          pk: data.pk,
          username: data.username,
          name: data.name,
          staff_role: data.staff_role,
          staff_department: data.staff_department,
        });
        setEmployee(null);
      } else if (data.employee) {
        setEmployee(data.employee);
        setAdminUser(null);
      } else {
        console.error('AuthContext.login response missing employee/adminUser payload', data);
        throw new Error('Unexpected login response from server.');
      }
    } catch (err: any) {
      console.error('AuthContext.login failed', err);
      throw err;
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
    <AuthContext.Provider value={{ loading, employee, adminUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
