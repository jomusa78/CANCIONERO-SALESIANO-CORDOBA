import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loginAsReader: (name?: string) => void;
  loginAsAdmin: (name: string, code: string) => { success: boolean; message?: string };
  updateAdminCode: (currentCode: string, newCode: string) => { success: boolean; message?: string };
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  adminCodeHint: string;
}

const DEFAULT_ADMIN_CODE = 'admin123';
const ADMIN_CODE_STORAGE_KEY = 'cancionero_admin_code';

const DEFAULT_READER: User = {
  id: 'user-lector',
  name: 'Lector Musical',
  email: 'lector@cancionero.com',
  role: 'usuario',
  avatarBg: 'bg-emerald-600',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always access initially as reader (modo lector)
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_READER);

  // Security code for group administrator
  const [adminCode, setAdminCode] = useState<string>(() => {
    try {
      const savedCode = localStorage.getItem(ADMIN_CODE_STORAGE_KEY);
      if (savedCode && savedCode.trim()) return savedCode.trim();
    } catch {
      // fallback
    }
    return DEFAULT_ADMIN_CODE;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_CODE_STORAGE_KEY, adminCode);
    } catch {
      // fallback
    }
  }, [adminCode]);

  // Set back to standard Reader mode
  const loginAsReader = (name?: string) => {
    setCurrentUser({
      id: `lector-${Date.now()}`,
      name: name?.trim() || 'Lector Musical',
      email: 'lector@cancionero.com',
      role: 'usuario',
      avatarBg: 'bg-emerald-600',
    });
    setIsAuthModalOpen(false);
  };

  // Login strictly as Administrator with name and security code
  const loginAsAdmin = (name: string, code: string): { success: boolean; message?: string } => {
    if (!name.trim()) {
      return { success: false, message: 'Por favor ingresa tu nombre de administrador.' };
    }
    if (!code.trim()) {
      return { success: false, message: 'Por favor ingresa el código o contraseña de administrador.' };
    }

    if (code.trim() !== adminCode) {
      return { 
        success: false, 
        message: 'Código o contraseña incorrecta. Solo el administrador autorizado puede acceder.' 
      };
    }

    const adminUser: User = {
      id: `admin-${Date.now()}`,
      name: name.trim(),
      email: 'admin@cancionero.com',
      role: 'administrador',
      avatarBg: 'bg-indigo-600',
    };

    setCurrentUser(adminUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // Allow the authenticated admin to change the group admin code
  const updateAdminCode = (currentCode: string, newCode: string): { success: boolean; message?: string } => {
    if (currentCode.trim() !== adminCode) {
      return { success: false, message: 'El código actual no coincide.' };
    }
    if (!newCode.trim() || newCode.trim().length < 4) {
      return { success: false, message: 'El nuevo código debe tener al menos 4 caracteres.' };
    }
    setAdminCode(newCode.trim());
    return { success: true, message: 'Código de administrador actualizado con éxito.' };
  };

  const logout = () => {
    // Return to reader mode
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
        loginAsReader,
        loginAsAdmin,
        updateAdminCode,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        adminCodeHint: adminCode,
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
