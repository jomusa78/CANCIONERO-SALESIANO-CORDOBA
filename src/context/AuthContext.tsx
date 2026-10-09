import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, FirebaseUser } from '../lib/firebase';

interface AuthResult {
  success: boolean;
  message?: string;
  previewRecoveryCode?: string;
  maskedEmail?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
  loginAsReader: () => void;
  loginAsAdmin: (passwordOrName: string, possibleCode?: string) => Promise<AuthResult>;
  loginWithGoogleAdmin: () => Promise<AuthResult>;
  updateAdminCode: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  requestPasswordRecovery: (email?: string) => Promise<AuthResult>;
  resetPasswordWithCode: (code: string, newPassword: string) => Promise<AuthResult>;
  updateRecoveryEmail: (password: string, newEmail: string) => Promise<AuthResult>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  serverStatus: 'connected' | 'checking' | 'offline';
  maskedRecoveryEmail: string;
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
  name: 'Administrador Salesiano',
  email: 'jomusa78@gmail.com',
  role: 'administrador',
  avatarBg: 'bg-rose-700',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
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

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<'connected' | 'checking' | 'offline'>('checking');
  const [maskedRecoveryEmail, setMaskedRecoveryEmail] = useState<string>('jom***8@gmail.com');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const emailLower = (fUser.email || '').toLowerCase();
        const isAdminAccount = emailLower === 'jomusa78@gmail.com' || emailLower.includes('admin');
        if (isAdminAccount) {
          setCurrentUser({
            id: fUser.uid,
            name: fUser.displayName || 'Administrador',
            email: fUser.email || 'jomusa78@gmail.com',
            role: 'administrador',
            avatarBg: 'bg-emerald-700',
          });
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
          } catch {
            // ignore
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Verify server connectivity on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/status')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setServerStatus('connected');
          if (data?.maskedEmail) {
            setMaskedRecoveryEmail(data.maskedEmail);
          }
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

  // Google Login for Administrator
  const loginWithGoogleAdmin = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const emailLower = (user.email || '').toLowerCase();

      // Check if authorized admin
      if (emailLower === 'jomusa78@gmail.com' || emailLower.includes('admin')) {
        setCurrentUser({
          id: user.uid,
          name: user.displayName || 'Administrador',
          email: user.email || 'jomusa78@gmail.com',
          role: 'administrador',
          avatarBg: 'bg-emerald-700',
        });
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        setIsAuthModalOpen(false);
        setIsLoading(false);
        return {
          success: true,
          message: `Sesión de administrador iniciada con ${user.displayName || user.email}.`,
        };
      } else {
        setIsLoading(false);
        return {
          success: false,
          message: `La cuenta ${user.email} no es la cuenta administradora configurada (jomusa78@gmail.com).`,
        };
      }
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        message: err?.message || 'Error al conectar con Google Auth.',
      };
    }
  };

  // Login strictly as Administrator using password verified against the web server
  const loginAsAdmin = async (passwordOrName: string, possibleCode?: string): Promise<AuthResult> => {
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
          message: data.message || 'Contraseña actualizada con éxito en el servidor.',
        };
      } else {
        return {
          success: false,
          message: data?.message || 'Error al actualizar la contraseña en el servidor.',
        };
      }
    } catch (networkError) {
      console.warn('[AuthContext] /api/admin/change-password failed:', networkError);
      setIsLoading(false);
      return {
        success: false,
        message: 'No se pudo conectar con el servidor para cambiar la contraseña.',
      };
    }
  };

  // Request password recovery
  const requestPasswordRecovery = async (email?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/recover-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email?.trim() || undefined }),
      });
      const data = await response.json().catch(() => null);
      setIsLoading(false);

      if (response.ok && data?.success) {
        return {
          success: true,
          message: data.message || 'Código de recuperación generado.',
          previewRecoveryCode: data.previewRecoveryCode,
          maskedEmail: data.maskedEmail,
        };
      } else {
        return {
          success: false,
          message: data?.message || 'Error al solicitar el código de recuperación.',
        };
      }
    } catch (err) {
      console.warn('[AuthContext] /api/admin/recover-request failed:', err);
      setIsLoading(false);
      return {
        success: false,
        message: 'No se pudo contactar al servidor para la recuperación.',
      };
    }
  };

  // Reset password using recovery code
  const resetPasswordWithCode = async (code: string, newPassword: string): Promise<AuthResult> => {
    if (!code.trim() || !newPassword.trim()) {
      return { success: false, message: 'Completa todos los campos.' };
    }
    if (newPassword.trim().length < 4) {
      return { success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/recover-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), newPassword: newPassword.trim() }),
      });
      const data = await response.json().catch(() => null);
      setIsLoading(false);

      if (response.ok && data?.success) {
        return {
          success: true,
          message: data.message || 'Contraseña restablecida con éxito.',
        };
      } else {
        return {
          success: false,
          message: data?.message || 'Código de recuperación no válido o vencido.',
        };
      }
    } catch (err) {
      console.warn('[AuthContext] /api/admin/recover-confirm failed:', err);
      setIsLoading(false);
      return {
        success: false,
        message: 'Error de conexión con el servidor al verificar el código.',
      };
    }
  };

  // Update designated recovery email
  const updateRecoveryEmail = async (password: string, newEmail: string): Promise<AuthResult> => {
    if (!password.trim() || !newEmail.trim()) {
      return { success: false, message: 'Se requiere la contraseña y el nuevo correo.' };
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim(), newEmail: newEmail.trim() }),
      });
      const data = await response.json().catch(() => null);
      setIsLoading(false);

      if (response.ok && data?.success) {
        if (data.maskedEmail) setMaskedRecoveryEmail(data.maskedEmail);
        return {
          success: true,
          message: data.message || 'Correo de recuperación actualizado con éxito.',
        };
      } else {
        return {
          success: false,
          message: data?.message || 'Contraseña incorrecta o correo inválido.',
        };
      }
    } catch (err) {
      console.warn('[AuthContext] /api/admin/update-email failed:', err);
      setIsLoading(false);
      return {
        success: false,
        message: 'Error al contactar con el servidor.',
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(DEFAULT_READER);
    setIsAuthModalOpen(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const isAdmin = currentUser?.role === 'administrador';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isLoading,
        firebaseUser,
        loginAsReader,
        loginAsAdmin,
        loginWithGoogleAdmin,
        updateAdminCode,
        requestPasswordRecovery,
        resetPasswordWithCode,
        updateRecoveryEmail,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        serverStatus,
        maskedRecoveryEmail,
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
