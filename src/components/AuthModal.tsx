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
  Loader2,
  Mail,
  HelpCircle,
  ArrowLeft,
  Check,
  Send,
  AtSign
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    loginAsAdmin, 
    isAdmin, 
    updateAdminCode,
    requestPasswordRecovery,
    resetPasswordWithCode,
    updateRecoveryEmail,
    logout,
    isLoading,
    maskedRecoveryEmail
  } = useAuth();

  // Admin login form state - ONLY password as requested
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery views: 'login' | 'recover-email' | 'recover-code'
  const [mode, setMode] = useState<'login' | 'recover-email' | 'recover-code'>('login');

  // Recovery state
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [newPasswordAfterRecovery, setNewPasswordAfterRecovery] = useState('');
  const [showNewPasswordAfterRecovery, setShowNewPasswordAfterRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'error' | 'success'; text: string; code?: string } | null>(null);

  // Change password toggle inside admin view
  const [showChangeCode, setShowChangeCode] = useState(false);
  const [currentCodeInput, setCurrentCodeInput] = useState('');
  const [newCodeInput, setNewCodeInput] = useState('');
  const [showChangePasswordVisible, setShowChangePasswordVisible] = useState(false);
  const [changeCodeMessage, setChangeCodeMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Update designated recovery email inside admin view
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [adminPasswordForEmail, setAdminPasswordForEmail] = useState('');
  const [newEmailConfigInput, setNewEmailConfigInput] = useState('');
  const [emailConfigMessage, setEmailConfigMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setAdminError('');
      setAdminPassword('');
      setShowPassword(false);
      setChangeCodeMessage(null);
      setShowChangeCode(false);
      setCurrentCodeInput('');
      setNewCodeInput('');
      setMode('login');
      setRecoveryEmailInput('');
      setRecoveryCodeInput('');
      setNewPasswordAfterRecovery('');
      setRecoveryMessage(null);
      setShowEmailConfig(false);
      setAdminPasswordForEmail('');
      setNewEmailConfigInput('');
      setEmailConfigMessage(null);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Handle standard login
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

  // Handle requesting recovery code to email
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);
    setIsSubmitting(true);

    const result = await requestPasswordRecovery(recoveryEmailInput);
    setIsSubmitting(false);

    if (result.success) {
      setRecoveryMessage({
        type: 'success',
        text: result.message || 'Código de recuperación generado.',
        code: result.previewRecoveryCode
      });
      // Pre-fill or switch to step 2: enter code and new password
      if (result.previewRecoveryCode) {
        setRecoveryCodeInput(result.previewRecoveryCode);
      }
      setMode('recover-code');
    } else {
      setRecoveryMessage({
        type: 'error',
        text: result.message || 'Error al solicitar la recuperación.'
      });
    }
  };

  // Handle resetting password with received code
  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);
    setIsSubmitting(true);

    const result = await resetPasswordWithCode(recoveryCodeInput, newPasswordAfterRecovery);
    setIsSubmitting(false);

    if (result.success) {
      setRecoveryMessage({
        type: 'success',
        text: '¡Contraseña restablecida exitosamente! Iniciando sesión...'
      });
      // Auto login with new password
      setTimeout(async () => {
        await loginAsAdmin(newPasswordAfterRecovery);
      }, 900);
    } else {
      setRecoveryMessage({
        type: 'error',
        text: result.message || 'Código incorrecto o expirado.'
      });
    }
  };

  // Handle change password when logged in as admin
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

  // Handle update recovery email when logged in as admin
  const handleUpdateEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailConfigMessage(null);
    setIsSubmitting(true);

    const result = await updateRecoveryEmail(adminPasswordForEmail, newEmailConfigInput);
    setIsSubmitting(false);

    if (result.success) {
      setEmailConfigMessage({
        type: 'success',
        text: result.message || 'Correo de recuperación actualizado con éxito.'
      });
      setAdminPasswordForEmail('');
      setNewEmailConfigInput('');
    } else {
      setEmailConfigMessage({
        type: 'error',
        text: result.message || 'Error al actualizar el correo de recuperación.'
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
              {mode !== 'login' ? <Mail className="w-4 h-4 text-slate-950" /> : <KeyRound className="w-4 h-4 text-slate-950" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isAdmin 
                  ? 'Modo Administrador Activo' 
                  : mode === 'recover-email'
                  ? 'Recuperar Contraseña'
                  : mode === 'recover-code'
                  ? 'Restablecer Contraseña'
                  : 'Entrar en Modo Administrador'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isAdmin 
                  ? 'Permisos de administración habilitados' 
                  : mode !== 'login'
                  ? 'Envío de código al correo registrado'
                  : 'Introduce la contraseña para gestionar el cancionero'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          {isAdmin ? (
            /* ========================================================
               ADMINISTRATOR ACTIVE VIEW
               ======================================================== */
            <div className="space-y-4">
              <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
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

              {/* Recovery Email Configuration */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmailConfig(!showEmailConfig)}
                  className="w-full text-left text-xs font-semibold text-slate-600 hover:text-amber-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>Correo de Recuperación: <strong className="text-slate-800">{maskedRecoveryEmail || 'Configurado'}</strong></span>
                  </span>
                  <span className="text-[11px] text-amber-600">{showEmailConfig ? 'Cerrar' : 'Modificar'}</span>
                </button>

                {showEmailConfig && (
                  <form onSubmit={handleUpdateEmailConfig} className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Configura el correo donde se enviarán las claves de recuperación si olvidas la contraseña.
                    </p>

                    {emailConfigMessage && (
                      <div className={`p-2 text-xs font-semibold rounded-lg ${
                        emailConfigMessage.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {emailConfigMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nuevo Correo de Recuperación
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmailConfigInput}
                        onChange={e => setNewEmailConfigInput(e.target.value)}
                        placeholder="tu-correo@ejemplo.com"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Contraseña Actual de Administrador
                      </label>
                      <input
                        type="password"
                        required
                        value={adminPasswordForEmail}
                        onChange={e => setAdminPasswordForEmail(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Guardar Correo en el Servidor</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Change secret password on web server */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangeCode(!showChangeCode)}
                  className="w-full text-left text-xs font-semibold text-slate-600 hover:text-amber-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cambiar contraseña de administrador</span>
                  </span>
                  <span className="text-[11px] text-amber-600">{showChangeCode ? 'Cerrar' : 'Cambiar'}</span>
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
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors text-center cursor-pointer"
                >
                  Continuar como Administrador
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeAuthModal();
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir a Modo Lector</span>
                </button>
              </div>
            </div>
          ) : mode === 'recover-email' ? (
            /* ========================================================
               PASSWORD RECOVERY - STEP 1: REQUEST CODE TO EMAIL
               ======================================================== */
            <form onSubmit={handleRequestRecovery} className="space-y-4">
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" /> Recuperación por Correo Electrónico
                </p>
                <p className="text-amber-800">
                  Ingresa el correo electrónico configurado para el administrador (<strong>{maskedRecoveryEmail || 'registrado en el servidor'}</strong>). Te enviaremos un código seguro para restablecer tu contraseña.
                </p>
              </div>

              {recoveryMessage && (
                <div className={`p-3 text-xs font-semibold rounded-xl flex items-start gap-2 ${
                  recoveryMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {recoveryMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <span>{recoveryMessage.text}</span>
                </div>
              )}

              <div>
                <label htmlFor="recovery-email-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico del Administrador *
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="recovery-email-input"
                    type="email"
                    required
                    autoFocus
                    value={recoveryEmailInput}
                    onChange={e => setRecoveryEmailInput(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-sans"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span>Destino predeterminado:</span>
                  <span className="font-semibold text-slate-700">{maskedRecoveryEmail}</span>
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  id="btn-send-recovery"
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-xl shadow-xs transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando código seguro...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Código de Recuperación</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setRecoveryMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a ingresar contraseña</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('recover-code');
                      setRecoveryMessage(null);
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 font-medium transition-colors cursor-pointer"
                  >
                    Ya tengo un código
                  </button>
                </div>
              </div>
            </form>
          ) : mode === 'recover-code' ? (
            /* ========================================================
               PASSWORD RECOVERY - STEP 2: CODE AND NEW PASSWORD
               ======================================================== */
            <form onSubmit={handleResetWithCode} className="space-y-4">
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-emerald-900">
                  <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" /> Código de Verificación Generado
                </p>
                <p className="text-emerald-800">
                  Introduce el código de 6 dígitos que fue emitido para el correo y define tu nueva contraseña de administrador.
                </p>
                {recoveryMessage?.code && (
                  <div className="mt-2.5 p-2 bg-emerald-100/90 rounded-lg border border-emerald-300 font-mono text-center">
                    <span className="text-[11px] text-emerald-800 block font-sans">Código de verificación para tu sesión:</span>
                    <strong className="text-lg tracking-widest text-emerald-950">{recoveryMessage.code}</strong>
                  </div>
                )}
              </div>

              {recoveryMessage && !recoveryMessage.code && (
                <div className={`p-3 text-xs font-semibold rounded-xl flex items-start gap-2 ${
                  recoveryMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {recoveryMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <span>{recoveryMessage.text}</span>
                </div>
              )}

              <div>
                <label htmlFor="recovery-code-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Código de 6 dígitos *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="recovery-code-input"
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={recoveryCodeInput}
                    onChange={e => setRecoveryCodeInput(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base tracking-widest font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="recovery-new-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña de Administrador *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="recovery-new-password"
                    type={showNewPasswordAfterRecovery ? 'text' : 'password'}
                    required
                    value={newPasswordAfterRecovery}
                    onChange={e => setNewPasswordAfterRecovery(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordAfterRecovery(!showNewPasswordAfterRecovery)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showNewPasswordAfterRecovery ? 'Ocultar' : 'Ver'}
                  >
                    {showNewPasswordAfterRecovery ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  id="btn-reset-password-confirm"
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-xs transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Restableciendo en el servidor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Nueva Contraseña y Entrar</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recover-email');
                      setRecoveryMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar correo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setRecoveryMessage(null);
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 font-semibold transition-colors cursor-pointer"
                  >
                    Volver al login
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ========================================================
               STANDARD LOGIN FORM: ONLY Password + Forgot Password Link
               ======================================================== */
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* USER REQUEST: "necesito que debajo del cuadro de ingresas contraseña administrador , haya opcion de recuperar contraseña si no recuerda a un correo que se añada" */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Server className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Servidor web seguro</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('recover-email');
                      setAdminError('');
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800 hover:underline transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>¿No recuerdas la contraseña? Recuperar por correo</span>
                  </button>
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
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
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
