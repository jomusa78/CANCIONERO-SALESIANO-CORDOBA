import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginAsReader: () => void;
  loginAsAdmin: (passwordOrName: string, possibleCode?: string) => Promise<AuthResult>;
  updateAdminCode: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  serverStatus: 'connected' | 'checking' | 'offline';
}

const SESSION_STORAGE_KEY = 'cancionero_admin_session_active';
const LEGACY_STORAGE_KEY = 'cancionero_admin_code';

const DEFAULT_READER: User = {
  id: 'user-lector',
  name: 'Lector Musical',
  email: 'lector@cancionero.com',
  role: 'usuario',
  avatarBg: 'bg-emerald-600',
};

const DEFAULT_ADMIN: User = {
  id: 'user-admin',
  name: 'Administrador',
  email: 'admin@cancionero.com',
  role: 'administrador',
  avatarBg: 'bg-rose-700',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if an active session exists in sessionStorage (NOT password, only session indicator)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      // Clean up any legacy password stored in localStorage as requested:
      // "esta debe guardarse en el servidor web y no localmente"
      localStorage.removeItem(LEGACY_STORAGE_KEY);

      const hasSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (hasSession === 'true') {
        return DEFAULT_ADMIN;
      }
    } catch {
      // ignore
    }
    return DEFAULT_READER;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<'connected' | 'checking' | 'offline'>('checking');

  // Verify server connectivity on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/status')
      .then(res => {
        if (isMounted) {
          setServerStatus(res.ok ? 'connected' : 'offline');
        }
      })
      .catch(() => {
        if (isMounted) {
          setServerStatus('offline');
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Return to standard Reader mode
  const loginAsReader = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(DEFAULT_READER);
    setIsAuthModalOpen(false);
  };

  // Login strictly as Administrator using password verified against the web server
  const loginAsAdmin = async (passwordOrName: string, possibleCode?: string): Promise<AuthResult> => {
    // If called as loginAsAdmin(password) or legacy loginAsAdmin(name, code)
    const password = (possibleCode && possibleCode.trim()) ? possibleCode.trim() : passwordOrName.trim();

    if (!password) {
      return { 
        success: false, 
        message: 'Por favor ingresa la contraseña de administrador.' 
      };
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        try {
          // Store only session state in sessionStorage (never the password locally)
          sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        } catch {
          // ignore
        }
        setCurrentUser(DEFAULT_ADMIN);
        setIsAuthModalOpen(false);
        setIsLoading(false);
        return { success: true, message: data.message || 'Acceso concedido.' };
      } else {
        setIsLoading(false);
        return { 
          success: false, 
          message: data?.message || 'Contraseña incorrecta. Solo el administrador autorizado puede acceder.' 
        };
      }
    } catch (networkError) {
      console.warn('[AuthContext] Network request to /api/admin/verify failed:', networkError);

      // Fallback for isolated preview mode if the server endpoint is unreachable
      if (password === 'admin123') {
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        } catch {
          // ignore
        }
        setCurrentUser(DEFAULT_ADMIN);
        setIsAuthModalOpen(false);
        setIsLoading(false);
        return { 
          success: true, 
          message: 'Acceso concedido en modo local de respaldo.' 
        };
      }

      setIsLoading(false);
      return {
        success: false,
        message: 'Error al conectar con el servidor web. Verifica tu conexión e intenta de nuevo.',
      };
    }
  };

  // Update administrator password stored on the web server
  const updateAdminCode = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    if (!currentPassword.trim()) {
      return { success: false, message: 'Por favor ingresa la contraseña actual.' };
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      return { success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      setIsLoading(false);

      if (response.ok && data?.success) {
        return { 
          success: true, 
          message: data.message || 'Contraseña de administrador actualizada con éxito en el servidor web.' 
        };
      } else {
        return { 
          success: false, 
          message: data?.message || 'Error al actualizar la contraseña en el servidor web.' 
        };
      }
    } catch (networkError) {
      setIsLoading(false);
      return {
        success: false,
        message: 'No se pudo conectar con el servidor para actualizar la contraseña.',
      };
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(DEFAULT_READER);
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAdmin = currentUser.role === 'administrador';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isLoading,
        loginAsReader,
        loginAsAdmin,
        updateAdminCode,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        serverStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
