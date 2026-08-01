import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { tokenStorage, setUnauthorizedHandler, clearUnauthorizedHandler } from '../api/client';

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
  profile_picture?: string;
  bio?: string;
};

export type AdminUser = {
  pk: number;
  username: string;
  name: string;
  staff_role: string;
  staff_department: string;
  profile_picture?: string;
  bio?: string;
};

type AuthContextValue = {
  loading: boolean;
  employee: Employee | null;
  adminUser: AdminUser | null;
  mustChangePassword: boolean;
  setMustChangePassword: (value: boolean) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAdminUser: (updates: Partial<AdminUser>) => void;
  updateEmployee: (updates: Partial<Employee>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const restoreSession = useCallback(async () => {
    console.log('[AUTH] AuthContext.restoreSession START', { timestamp: new Date().toISOString() });
    const token = await tokenStorage.get();
    if (!token) {
      console.log('[AUTH] AuthContext.restoreSession: No token found, user not logged in');
      setLoading(false);
      return;
    }
    try {
      console.log('[AUTH] AuthContext.restoreSession: Token found, fetching session');
      const { data } = await api.get('/api/session/');
      console.log('[AUTH] AuthContext.restoreSession response', { role: data.role, pk: data.pk });
      if (data.role === 'admin') {
        setAdminUser({
          pk: data.pk,
          username: data.username,
          name: data.name,
          staff_role: data.staff_role,
          staff_department: data.staff_department,
          profile_picture: data.profile_picture,
          bio: data.bio,
        });
        setEmployee(null);
        setMustChangePassword(data.must_change_password === true);
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
          profile_picture: data.profile_picture,
          bio: data.bio,
        });
        setAdminUser(null);
        setMustChangePassword(false);
      } else {
        console.log('[AUTH] AuthContext.restoreSession: unauthenticated or unexpected session response', data);
        await tokenStorage.clear();
        setEmployee(null);
        setAdminUser(null);
        setMustChangePassword(false);
      }
    } catch (err) {
      console.error('[AUTH] AuthContext.restoreSession failed', err);
      await tokenStorage.clear();
      setEmployee(null);
      setAdminUser(null);
    } finally {
      console.log('[AUTH] AuthContext.restoreSession COMPLETE, setting loading=false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (username: string, password: string) => {
    console.log('[AUTH] AuthContext.login START', { username, timestamp: new Date().toISOString() });
    try {
      console.log('[AUTH] AuthContext.login: Making API request to /api/mobile/login/');
      const response = await api.post('/api/mobile/login/', {
        username,
        password,
        device_label: 'React Native app',
      });

      // Extract data from response
      const data = response?.data;
      console.log('[AUTH] AuthContext.login RESPONSE RECEIVED', {
        hasData: !!data,
        status: response?.status,
        dataKeys: data ? Object.keys(data) : [],
        timestamp: new Date().toISOString()
      });

      // Validate response structure
      if (!data) {
        console.error('[AUTH] AuthContext.login VALIDATION ERROR: Response data is empty or null');
        throw new Error('Server returned an empty response. Please try again.');
      }

      if (!data.token) {
        console.error('[AUTH] AuthContext.login VALIDATION ERROR: Response missing token field', { dataKeys: Object.keys(data) });
        throw new Error('Server response is missing authentication token. Please try again or contact support.');
      }

      console.log('AuthContext.login: Storing token');
      await tokenStorage.set(data.token);
      console.log('AuthContext.login: Token stored successfully');

      // Handle admin login
      if (data.role === 'admin') {
        console.log('[AUTH] AuthContext.login: ADMIN login detected', { pk: data.pk, username: data.username });
        if (!data.pk || !data.username) {
          console.error('[AUTH] AuthContext.login ADMIN ERROR missing fields', { pk: data.pk, username: data.username });
          throw new Error('Server returned incomplete admin information. Please try again.');
        }
        console.log('[AUTH] AuthContext.login: CALLING setAdminUser()');
        setAdminUser({
          pk: data.pk,
          username: data.username,
          name: data.name,
          staff_role: data.staff_role,
          staff_department: data.staff_department,
          profile_picture: data.profile_picture,
          bio: data.bio,
        });
        console.log('[AUTH] AuthContext.login: CALLED setAdminUser');
        setEmployee(null);
        setMustChangePassword(data.must_change_password === true);
        console.log('[AUTH] AuthContext.login: ADMIN STATE UPDATES COMPLETE');
      }
      // Handle employee login
      else if (data.employee) {
        console.log('[AUTH] AuthContext.login: EMPLOYEE login detected', { pk: data.employee.pk, username: data.employee.username });
        if (!data.employee.pk || !data.employee.username) {
          console.error('[AUTH] AuthContext.login EMPLOYEE ERROR missing fields', {
            employeePk: data.employee.pk,
            employeeUsername: data.employee.username
          });
          throw new Error('Server returned incomplete employee information. Please try again.');
        }
        console.log('[AUTH] AuthContext.login: CALLING setEmployee()');
        setEmployee({
          ...data.employee,
          profile_picture: data.employee.profile_picture,
          bio: data.employee.bio,
        });
        console.log('[AUTH] AuthContext.login: CALLED setEmployee');
        setAdminUser(null);
        setMustChangePassword(false);
        console.log('[AUTH] AuthContext.login: EMPLOYEE STATE UPDATES COMPLETE');
      }
      // Unknown response format
      else {
        console.error('[AUTH] AuthContext.login ERROR: Unexpected response format', {
          hasRole: !!data.role,
          hasEmployee: !!data.employee,
          dataKeys: Object.keys(data || {})
        });
        throw new Error('Unexpected server response format. Please try again or contact support.');
      }

      console.log('[AUTH] AuthContext.login SUCCESS', { timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error('[AUTH] AuthContext.login CAUGHT ERROR', {
        errorMessage: err?.message,
        errorCode: err?.code,
        errorResponse: err?.response?.status,
        errorData: err?.response?.data,
        timestamp: new Date().toISOString()
      });

      // Ensure token is cleared on any error
      try {
        await tokenStorage.clear();
        console.log('[AUTH] AuthContext.login: Token cleared after error');
      } catch (clearErr) {
        console.error('[AUTH] AuthContext.login: Failed to clear token after error', clearErr);
      }

      // Re-throw with user-friendly message
      const userMessage = err?.message || 'Login failed. Please check your credentials and try again.';
      throw new Error(userMessage);
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
    setMustChangePassword(false);
  }, []);

  const updateAdminUser = useCallback((updates: Partial<AdminUser>) => {
    setAdminUser((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const updateEmployee = useCallback((updates: Partial<Employee>) => {
    setEmployee((current) => (current ? { ...current, ...updates } : current));
  }, []);

  // ── Force-logout: used when the API interceptor sees a 401 on an
  // authenticated request (deleted employee, revoked token, etc.).
  // Skips the /api/mobile/logout/ network call since the token is already
  // dead on the server — just clears local state and storage.
  const forceLogout = useCallback(async () => {
    console.warn('[AUTH] forceLogout triggered — clearing session without server call');
    await tokenStorage.clear();
    setEmployee(null);
    setAdminUser(null);
    setMustChangePassword(false);
  }, []);

  // Register / unregister the global 401 handler with the Axios client.
  // This runs once after mount and cleans up on unmount, breaking the
  // circular-import problem: client.ts never imports AuthContext, it just
  // calls whatever callback was registered here.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      forceLogout().catch((err) =>
        console.error('[AUTH] forceLogout error in 401 handler:', err)
      );
    });
    return () => {
      clearUnauthorizedHandler();
    };
  }, [forceLogout]);

  return (
    <AuthContext.Provider value={{ loading, employee, adminUser, mustChangePassword, setMustChangePassword, login, logout, updateAdminUser, updateEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
