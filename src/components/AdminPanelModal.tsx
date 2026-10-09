import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSongs } from '../context/SongContext';
import { 
  X, 
  Plus, 
  Save, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  RotateCcw, 
  Check, 
  Tag as TagIcon,
  Music,
  ListOrdered,
  Lock,
  Server,
  Loader2,
  HelpCircle,
  Upload,
  FileText,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (song: Song) => void;
}

const COMMON_TAGS = ['Alabanza', 'Himno', 'Adoración', 'Don Bosco', 'Salesiano', 'María Auxiliadora', 'Juvenil', 'Pascua', 'Adviento', 'Comunión', 'Entrada', 'Envío'];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const { isAdmin, loginAsAdmin, openAuthModal } = useAuth();
  const { 
    songs, 
    addSong, 
    updateSong, 
    editingSong, 
    setEditingSong, 
    resetDefaultSongs,
    setSelectedSong 
  } = useSongs();

  // Active view inside modal: 'list' (manage songs) or 'form' (add/edit)
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');

  // Gate form state when not admin (only password)
  const [gateAdminPassword, setGateAdminPassword] = useState('');
  const [gateShowPassword, setGateShowPassword] = useState(false);
  const [gateError, setGateError] = useState('');
  const [gateIsSubmitting, setGateIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tags, setTags] = useState<string[]>(['Salesiano']);
  const [newTagInput, setNewTagInput] = useState('');
  const [content, setContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [pdfFileName, setPdfFileName] = useState<string | undefined>(undefined);
  const [pdfFileSize, setPdfFileSize] = useState<number | undefined>(undefined);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const [validationError, setValidationError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync form when editingSong changes
  useEffect(() => {
    if (editingSong) {
      setTitle(editingSong.title);
      setArtist(editingSong.artist);
      setTags(editingSong.tags || []);
      setContent(editingSong.content || '');
      setPdfUrl(editingSong.pdfUrl);
      setPdfFileName(editingSong.pdfFileName);
      setPdfFileSize(editingSong.pdfFileSize);
      setPdfError('');
      setActiveTab('form');
    } else {
      resetForm();
    }
  }, [editingSong]);

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setTags(['Salesiano']);
    setNewTagInput('');
    setContent('');
    setPdfUrl(undefined);
    setPdfFileName(undefined);
    setPdfFileSize(undefined);
    setPdfError('');
    setValidationError('');
  };

  if (!isOpen) return null;

  // Protected check: If not admin, show secure credential prompt
  if (!isAdmin) {
    const handleGateSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setGateError('');
      setGateIsSubmitting(true);
      const res = await loginAsAdmin(gateAdminPassword);
      setGateIsSubmitting(false);
      if (!res.success) {
        setGateError(res.message || 'Contraseña incorrecta');
      } else {
        setGateAdminPassword('');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Acceso de Administrador</h2>
              <p className="text-xs text-slate-500">Introduce la contraseña de administrador para gestionar canciones.</p>
            </div>
          </div>

          <form onSubmit={handleGateSubmit} className="space-y-4">
            {gateError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {gateError}
              </div>
            )}

            <div>
              <label htmlFor="gate-admin-code" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña de Administrador *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="gate-admin-code"
                  type={gateShowPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={gateAdminPassword}
                  onChange={e => setGateAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white font-sans"
                />
                <button
                  type="button"
                  onClick={() => setGateShowPassword(!gateShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={gateShowPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {gateShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Server className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Verificada en el servidor web</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3 text-indigo-500" />
                  <span>¿Olvidaste la clave? Recuperar por correo</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="btn-gate-submit"
                type="submit"
                disabled={gateIsSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {gateIsSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando en el servidor...</span>
                  </>
                ) : (
                  <span>Validar y Desbloquear Panel</span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center cursor-pointer"
              >
                Volver al Modo Lectura
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Handle PDF file selection and reading
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Por favor selecciona un archivo en formato PDF (.pdf).');
      return;
    }

    // Limit to reasonable size for browser storage (e.g. 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setPdfError('El archivo PDF excede el tamaño máximo permitido (15 MB).');
      return;
    }

    setIsProcessingPdf(true);
    setPdfError('');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPdfUrl(result);
      setPdfFileName(file.name);
      setPdfFileSize(file.size);
      setIsProcessingPdf(false);

      // Auto-populate Title if empty from filename
      if (!title.trim()) {
        const cleanName = file.name
          .replace(/\.pdf$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        // Capitalize words
        const formatted = cleanName
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        setTitle(formatted);
      }
    };

    reader.onerror = () => {
      setPdfError('Error al leer el archivo PDF. Intenta de nuevo.');
      setIsProcessingPdf(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    setPdfUrl(undefined);
    setPdfFileName(undefined);
    setPdfFileSize(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Tag management: add / remove
  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('El título de la canción es obligatorio.');
      return;
    }
    if (!artist.trim()) {
      setValidationError('El nombre del artista, coro o compositor es obligatorio.');
      return;
    }
    if (!pdfUrl && !content.trim()) {
      setValidationError('Debes subir un archivo PDF con la canción o partitura.');
      return;
    }

    setValidationError('');

    if (editingSong) {
      updateSong(editingSong.id, {
        title: title.trim(),
        artist: artist.trim(),
        tags,
        content: content.trim(),
        pdfUrl,
        pdfFileName,
        pdfFileSize,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingSong(null);
        setActiveTab('list');
      }, 900);
    } else {
      addSong({
        title: title.trim(),
        artist: artist.trim(),
        tags,
        content: content.trim(),
        pdfUrl,
        pdfFileName,
        pdfFileSize,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('list');
        resetForm();
      }, 900);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Panel de Administración
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  CANCIONERO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gestión de catálogo: subida de archivos PDF, etiquetas y edición.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="admin-tab-list"
              type="button"
              onClick={() => {
                setActiveTab('list');
                setEditingSong(null);
              }}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'list'
                  ? 'border-[#b31942] text-[#b31942]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Lista de Canciones ({songs.length})</span>
            </button>

            <button
              id="admin-tab-form"
              type="button"
              onClick={() => {
                setActiveTab('form');
                if (!editingSong) resetForm();
              }}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'form'
                  ? 'border-[#b31942] text-[#b31942]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{editingSong ? `Editar: ${editingSong.title}` : 'Subir Canción (PDF)'}</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              type="button"
              onClick={resetDefaultSongs}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1.5 px-2.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Restaura las canciones de ejemplo iniciales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer ejemplos</span>
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: Song Management Table */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-slate-600">
                  Total de canciones cargadas en el catálogo: <strong className="text-slate-900">{songs.length}</strong>
                </p>
                <button
                  id="admin-add-song-quick-btn"
                  type="button"
                  onClick={() => {
                    setEditingSong(null);
                    resetForm();
                    setActiveTab('form');
                  }}
                  className="px-3.5 py-2 bg-[#b31942] hover:bg-[#991538] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Subir Canción (PDF)</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Título</th>
                      <th className="py-3 px-4">Artista / Coro</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Formato</th>
                      <th className="py-3 px-4 hidden md:table-cell">Etiquetas</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {songs.map(song => (
                      <tr key={song.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {song.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {song.artist}
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          {song.pdfUrl ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <FileText className="w-3 h-3 text-rose-600" /> Archivo PDF
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Music className="w-3 h-3 text-slate-400" /> Letra
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {song.tags.slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                {t}
                              </span>
                            ))}
                            {song.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{song.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSong(song);
                                onClose();
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Ver canción"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSong(song);
                                setActiveTab('form');
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar canción"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onConfirmDelete(song)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar canción"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Song Form - PDF Upload & Tags Management */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Top Banner Status */}
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>¡Canción guardada correctamente en el cancionero!</span>
                </div>
              )}

              {/* UPLOAD PDF SECTION (Principal) */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 sm:p-6 text-center hover:border-rose-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="pdf-upload-input"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfFileChange}
                  className="hidden"
                />

                {pdfUrl ? (
                  /* PDF uploaded state */
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-rose-200 shadow-2xs text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            PDF Cargado
                          </span>
                          {pdfFileSize && (
                            <span className="text-xs text-slate-400">
                              {formatFileSize(pdfFileSize)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5 break-all">
                          {pdfFileName || 'archivo-partitura.pdf'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        Cambiar archivo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar PDF</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty upload state */
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#b31942] flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                      Subir archivo PDF de la canción
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      Sube la partitura o letra en formato PDF (.pdf). Podrás visualizarla directamente en el cancionero y descargarla cuando quieras.
                    </p>
                    <button
                      type="button"
                      disabled={isProcessingPdf}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-[#b31942] hover:bg-[#991538] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      {isProcessingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Procesando PDF...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Seleccionar archivo PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {pdfError && (
                  <p className="text-xs text-red-600 font-semibold mt-3">
                    {pdfError}
                  </p>
                )}
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label htmlFor="form-song-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Título de la Canción *
                  </label>
                  <input
                    id="form-song-title"
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Salve Don Bosco Santo"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {/* Artist */}
                <div>
                  <label htmlFor="form-song-artist" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Artista / Coro / Autor *
                  </label>
                  <input
                    id="form-song-artist"
                    type="text"
                    required
                    value={artist}
                    onChange={e => setArtist(e.target.value)}
                    placeholder="Ej. Tradicional Salesiano / Coro Juvenil"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* TAGS SECTION: AÑADIR Y ELIMINAR ETIQUETAS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Etiquetas de la Canción ({tags.length})</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500 normal-case">
                    Puedes añadir y eliminar libremente cualquier etiqueta
                  </span>
                </label>

                {/* ACTIVE TAGS WITH REMOVE (X) BUTTON */}
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Etiquetas asignadas actualmente:
                  </span>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-300 shadow-2xs group"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
                            title={`Eliminar etiqueta ${tag}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 italic">
                      No hay etiquetas asignadas. Selecciona una de las sugeridas o escribe una nueva.
                    </p>
                  )}
                </div>

                {/* SUGGESTED TAGS TOGGLE */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Sugerencias frecuentes (clic para activar o desactivar):
                  </span>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {COMMON_TAGS.map(t => {
                      const isSelected = tags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleToggleTag(t)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#b31942] text-white shadow-2xs font-semibold'
                              : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                          }`}
                        >
                          {t} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  {/* CUSTOM TAG ADDER */}
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      placeholder="Nueva etiqueta personalizada..."
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs flex-1 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      + Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* OPTIONAL LYRICS TEXTAREA (Complementario al PDF para búsqueda semántica) */}
              <div>
                <label htmlFor="song-content-editor" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Texto o Letra de la Canción (Opcional)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Puedes pegar aquí la letra para permitir que los usuarios encuentren la canción al buscar fragmentos de estrofas.
                </p>
                <textarea
                  id="song-content-editor"
                  rows={6}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Pega aquí la letra o versos de la canción..."
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm font-sans leading-relaxed focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSong(null);
                    setActiveTab('list');
                  }}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  id="form-save-song-btn"
                  type="submit"
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#b31942] hover:bg-[#991538] rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSong ? 'Guardar Cambios' : 'Guardar Canción'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
