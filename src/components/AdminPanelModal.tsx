import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSongs } from '../context/SongContext';
import { parseSongContent } from '../utils/chordUtils';
import { 
  X, 
  Plus, 
  Save, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff,
  FileCode, 
  ShieldAlert, 
  RotateCcw, 
  Check, 
  Tag as TagIcon,
  Music,
  ListOrdered,
  Lock,
  Server,
  Loader2
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (song: Song) => void;
}

const COMMON_CHORDS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Em', 'Dm', 'Bm', 'F#m', 'E7', 'A7', 'D7', 'G7'];
const SECTION_TAGS = ['[Intro]', '[Verso 1]', '[Verso 2]', '[Pre-Coro]', '[Coro]', '[Puente]', '[Final]'];
const PRESET_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Am', 'Em', 'Dm', 'Bm'];
const COMMON_TAGS = ['Alabanza', 'Himno', 'Adoración', 'Pop', 'Rock', 'Balada', 'Acústico', 'Latino', 'Inspiración'];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const { isAdmin, loginAsAdmin } = useAuth();
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
  const [originalKey, setOriginalKey] = useState('G');
  const [bpm, setBpm] = useState<number | undefined>(80);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tags, setTags] = useState<string[]>(['Alabanza']);
  const [newTagInput, setNewTagInput] = useState('');
  const [content, setContent] = useState('');
  const [formPreviewTab, setFormPreviewTab] = useState<'editor' | 'preview'>('editor');
  const [validationError, setValidationError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form when editingSong changes
  useEffect(() => {
    if (editingSong) {
      setTitle(editingSong.title);
      setArtist(editingSong.artist);
      setOriginalKey(editingSong.originalKey);
      setBpm(editingSong.bpm);
      setTimeSignature(editingSong.timeSignature || '4/4');
      setTags(editingSong.tags);
      setContent(editingSong.content);
      setActiveTab('form');
    } else {
      resetForm();
    }
  }, [editingSong]);

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setOriginalKey('G');
    setBpm(80);
    setTimeSignature('4/4');
    setTags(['Alabanza']);
    setNewTagInput('');
    setContent(`[Intro]
[G] [C] [D] [G]

[Verso 1]
Escribe aquí la letra de la can[G]ción,
colocando los acordes entre [C]corchetes [D]
directamente antes de cada síla[G]ba.

[Coro]
¡Este es el [C]coro princi[D]pal!
Con acordes [G]vivos y mu[Em]sicales,
¡Cantando al [C]mundo con a[D]legrí[G]a!`);
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={gateShowPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {gateShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                <Server className="w-3 h-3 text-emerald-600" />
                <span>Verificada en el servidor web</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="btn-gate-submit"
                type="submit"
                disabled={gateIsSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
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
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center"
              >
                Volver al Modo Lectura
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Insert chord or tag into textarea at cursor position
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = document.getElementById('song-content-editor') as HTMLTextAreaElement | null;
    if (!textarea) {
      setContent(prev => prev + ' ' + textToInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      if (tags.length > 1) {
        setTags(tags.filter(t => t !== tag));
      }
    } else {
      setTags([...tags, tag]);
    }
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
      setValidationError('El nombre del artista o compositor es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setValidationError('La letra de la canción no puede estar vacía.');
      return;
    }

    setValidationError('');

    if (editingSong) {
      updateSong(editingSong.id, {
        title: title.trim(),
        artist: artist.trim(),
        originalKey,
        bpm: bpm ? Number(bpm) : undefined,
        timeSignature,
        tags,
        content: content.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingSong(null);
        setActiveTab('list');
      }, 1000);
    } else {
      const created = addSong({
        title: title.trim(),
        artist: artist.trim(),
        originalKey,
        bpm: bpm ? Number(bpm) : undefined,
        timeSignature,
        tags,
        content: content.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('list');
        resetForm();
      }, 1000);
    }
  };

  // Preview parsed lines in live preview
  const liveParsed = parseSongContent(content, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Panel de Administración
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  CRUD Activo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gestión de catálogo: añadir, editar y eliminar canciones y acordes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="admin-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-700'
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
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'form'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{editingSong ? `Editar: ${editingSong.title}` : 'Añadir Nueva Canción'}</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              type="button"
              onClick={resetDefaultSongs}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1.5 px-2.5 rounded-lg hover:bg-slate-200/60 transition-colors"
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
                  Total de canciones cargadas en el catálogo actual: <strong className="text-slate-900">{songs.length}</strong>
                </p>
                <button
                  id="admin-add-song-quick-btn"
                  type="button"
                  onClick={() => {
                    setEditingSong(null);
                    resetForm();
                    setActiveTab('form');
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Canción</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Título</th>
                      <th className="py-3 px-4">Artista</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Tono</th>
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
                        <td className="py-3 px-4 hidden sm:table-cell font-mono-chord font-bold text-amber-700">
                          {song.originalKey}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {song.tags.slice(0, 2).map(t => (
                              <span key={t} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                {t}
                              </span>
                            ))}
                            {song.tags.length > 2 && (
                              <span className="text-[10px] text-slate-400">+{song.tags.length - 2}</span>
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
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
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
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar canción"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onConfirmDelete(song)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* TAB 2: Song Form (Add / Edit) with Live Preview */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Top Banner Status */}
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl">
                  {validationError}
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>¡Canción guardada correctamente en el cancionero!</span>
                </div>
              )}

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Title */}
                <div className="sm:col-span-2">
                  <label htmlFor="form-song-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Título de la Canción *
                  </label>
                  <input
                    id="form-song-title"
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Cuán Grande Es Él"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Artist */}
                <div className="sm:col-span-2">
                  <label htmlFor="form-song-artist" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Artista / Compositor *
                  </label>
                  <input
                    id="form-song-artist"
                    type="text"
                    required
                    value={artist}
                    onChange={e => setArtist(e.target.value)}
                    placeholder="Ej. Marcos Witt / Tradicional"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Tonality / Original Key */}
                <div>
                  <label htmlFor="form-song-key" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tono Original
                  </label>
                  <select
                    id="form-song-key"
                    value={originalKey}
                    onChange={e => setOriginalKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono-chord font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  >
                    {PRESET_KEYS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* Tempo / BPM */}
                <div>
                  <label htmlFor="form-song-bpm" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tempo (BPM)
                  </label>
                  <input
                    id="form-song-bpm"
                    type="number"
                    min="30"
                    max="240"
                    value={bpm || ''}
                    onChange={e => setBpm(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ej. 72"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                {/* Time signature */}
                <div>
                  <label htmlFor="form-song-signature" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Métrica
                  </label>
                  <select
                    id="form-song-signature"
                    value={timeSignature}
                    onChange={e => setTimeSignature(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                  >
                    <option value="4/4">4/4</option>
                    <option value="3/4">3/4</option>
                    <option value="6/8">6/8</option>
                    <option value="2/4">2/4</option>
                  </select>
                </div>

              </div>

              {/* Tags Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Etiquetas / Géneros:</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_TAGS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToggleTag(t)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        tags.includes(t)
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t} {tags.includes(t) && '✓'}
                    </button>
                  ))}
                </div>

                {/* Custom tag adder */}
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
                    placeholder="Añadir otra etiqueta..."
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs flex-1 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Chords & Lyrics Editor Section */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <label htmlFor="song-content-editor" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Letra con Acordes (Formato ChordPro) *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Escribe los acordes entre corchetes, ej: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-800">[G]Letra</code>
                    </p>
                  </div>

                  {/* Switch between Editor and Real-Time Preview */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormPreviewTab('editor')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                        formPreviewTab === 'editor'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPreviewTab('preview')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                        formPreviewTab === 'preview'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vista Previa</span>
                    </button>
                  </div>
                </div>

                {/* Chord Helper Insert Toolbar */}
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-t-xl flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-bold mr-1">Insertar:</span>
                  {COMMON_CHORDS.map(chord => (
                    <button
                      key={chord}
                      type="button"
                      onClick={() => insertTextAtCursor(`[${chord}]`)}
                      className="px-2 py-1 bg-white hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-mono-chord font-bold rounded border border-slate-200 shadow-2xs transition-colors"
                    >
                      [{chord}]
                    </button>
                  ))}
                  <div className="h-4 w-px bg-slate-300 mx-1" />
                  {SECTION_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTextAtCursor(`\n${tag}\n`)}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded border border-indigo-200 text-[11px] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Editor textarea vs Live Preview */}
                {formPreviewTab === 'editor' ? (
                  <textarea
                    id="song-content-editor"
                    required
                    rows={12}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="[G]Señor, mi Dios... al contemplar los cielos..."
                    className="w-full p-4 bg-white border border-t-0 border-slate-300 rounded-b-xl text-sm font-mono leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                ) : (
                  <div className="w-full min-h-[280px] p-6 bg-slate-50 border border-t-0 border-slate-300 rounded-b-xl overflow-y-auto max-h-[350px]">
                    <div className="text-xs text-slate-500 mb-3 italic">
                      Vista previa de cómo los músicos verán los acordes directamente encima de la letra:
                    </div>
                    <div className="space-y-3 font-sans text-sm">
                      {liveParsed.map((line, idx) => {
                        if (line.isSectionHeader) {
                          return (
                            <div key={idx} className="pt-2">
                              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-slate-200 text-slate-800">
                                {line.headerName}
                              </span>
                            </div>
                          );
                        }
                        const isAllEmpty = line.segments.every(s => !s.chord && !s.text.trim());
                        if (isAllEmpty) return <div key={idx} className="h-2" />;

                        return (
                          <div key={idx} className="flex flex-wrap items-end gap-x-1 leading-none">
                            {line.segments.map((seg, sIdx) => (
                              <span key={sIdx} className="inline-flex flex-col items-start">
                                <span className="font-mono-chord font-bold text-amber-700 text-xs min-h-[1.25em]">
                                  {seg.chord || ''}
                                </span>
                                <span className="text-slate-900 font-medium">
                                  {seg.text || ' '}
                                </span>
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSong(null);
                    setActiveTab('list');
                  }}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id="form-save-song-btn"
                    type="submit"
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingSong ? 'Guardar Cambios' : 'Crear Canción'}</span>
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
