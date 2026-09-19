import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Key,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  Server,
  Loader2
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    loginAsAdmin, 
    isAdmin, 
    updateAdminCode,
    logout,
    isLoading
  } = useAuth();

  // Admin login form state - ONLY password as requested
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change password toggle
  const [showChangeCode, setShowChangeCode] = useState(false);
  const [currentCodeInput, setCurrentCodeInput] = useState('');
  const [newCodeInput, setNewCodeInput] = useState('');
  const [showChangePasswordVisible, setShowChangePasswordVisible] = useState(false);
  const [changeCodeMessage, setChangeCodeMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setAdminError('');
      setAdminPassword('');
      setShowPassword(false);
      setChangeCodeMessage(null);
      setShowChangeCode(false);
      setCurrentCodeInput('');
      setNewCodeInput('');
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setIsSubmitting(true);

    const result = await loginAsAdmin(adminPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setAdminError(result.message || 'Contraseña incorrecta. Acceso denegado.');
    }
  };

  const handleChangeCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeCodeMessage(null);
    setIsSubmitting(true);

    const result = await updateAdminCode(currentCodeInput, newCodeInput);
    setIsSubmitting(false);

    if (result.success) {
      setChangeCodeMessage({ 
        type: 'success', 
        text: result.message || 'Contraseña modificada con éxito en el servidor.' 
      });
      setCurrentCodeInput('');
      setNewCodeInput('');
    } else {
      setChangeCodeMessage({ 
        type: 'error', 
        text: result.message || 'Error al cambiar la contraseña en el servidor.' 
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
              <KeyRound className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isAdmin ? 'Modo Administrador Activo' : 'Entrar en Modo Administrador'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isAdmin ? 'Permisos de administración habilitados' : 'Introduce la contraseña para gestionar el cancionero'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          {isAdmin ? (
            /* Currently in Admin Mode */
            <div className="space-y-4">
              <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider bg-amber-200/70 px-2 py-0.5 rounded-md">
                      Administrador
                    </span>
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Server className="w-2.5 h-2.5" /> Servidor Web
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    Tienes permisos completos habilitados para crear nuevas canciones, editar acordes en tiempo real y organizar el catálogo.
                  </p>
                </div>
              </div>

              {/* Change secret password on web server */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangeCode(!showChangeCode)}
                  className="text-xs font-semibold text-slate-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors"
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>{showChangeCode ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña en el servidor web'}</span>
                </button>

                {showChangeCode && (
                  <form onSubmit={handleChangeCodeSubmit} className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <p className="text-[11px] text-slate-500 leading-snug">
                      La nueva contraseña se guardará en el servidor web (no localmente en tu navegador).
                    </p>

                    {changeCodeMessage && (
                      <div className={`p-2 text-xs font-semibold rounded-lg ${
                        changeCodeMessage.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {changeCodeMessage.text}
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Contraseña Actual del Servidor
                      </label>
                      <input
                        type="password"
                        required
                        value={currentCodeInput}
                        onChange={e => setCurrentCodeInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showChangePasswordVisible ? 'text' : 'password'}
                          required
                          value={newCodeInput}
                          onChange={e => setNewCodeInput(e.target.value)}
                          placeholder="Mínimo 4 caracteres"
                          className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowChangePasswordVisible(!showChangePasswordVisible)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          title={showChangePasswordVisible ? 'Ocultar' : 'Mostrar'}
                        >
                          {showChangePasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Guardar Nueva Contraseña en el Servidor</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors text-center"
                >
                  Continuar como Administrador
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeAuthModal();
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir a Modo Lector</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form: ONLY Password (NO Admin Name Field) */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 sm:p-3.5 text-xs text-amber-950 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" /> Acceso de Administrador
                </p>
                <p className="text-amber-800">
                  Ingresa la contraseña para activar los permisos de añadir, editar y organizar las canciones.
                </p>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              {/* ONLY Password Input */}
              <div>
                <label htmlFor="admin-modal-code" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contraseña de Administrador *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-modal-code"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Escribe la contraseña..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                  <Server className="w-3 h-3 text-emerald-600" />
                  <span>Verificación segura y almacenada en el servidor web</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  id="btn-admin-login-submit"
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-xl shadow-xs transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando en el servidor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Entrar en Modo Administrador</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  Cancelar y permanecer en Modo Lector
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
