import React, { useMemo } from 'react';
import { Song } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSongs } from '../context/SongContext';
import { 
  ArrowLeft, 
  Heart, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  ExternalLink,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { getPdfBlobUrl, openPdfDirectly } from '../utils/pdfViewer';

interface SongDetailViewProps {
  song: Song;
  onBack: () => void;
  onEdit: (song: Song) => void;
}

export const SongDetailView: React.FC<SongDetailViewProps> = ({ song, onBack, onEdit }) => {
  const { isAdmin } = useAuth();
  const { songs, setSelectedSong, toggleFavorite } = useSongs();

  // Navigation between songs
  const currentIndex = songs.findIndex(s => s.id === song.id);
  const prevSong = currentIndex > 0 ? songs[currentIndex - 1] : null;
  const nextSong = currentIndex < songs.length - 1 ? songs[currentIndex + 1] : null;

  // Convert base64 or Data URI into a safe, same-origin Blob URL for embedded iframe viewing
  const pdfBlobUrl = useMemo(() => {
    return getPdfBlobUrl(song.pdfUrl);
  }, [song.pdfUrl]);

  const handleOpenPdf = () => {
    if (song.pdfUrl) {
      openPdfDirectly(song.pdfUrl, song.pdfFileName);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200">
        <button
          id="btn-back-to-catalog"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Volver al Catálogo</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {prevSong && (
            <button
              type="button"
              onClick={() => setSelectedSong(prevSong)}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title={`Anterior: ${prevSong.title} · ${prevSong.artist}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {nextSong && (
            <button
              type="button"
              onClick={() => setSelectedSong(nextSong)}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title={`Siguiente: ${nextSong.title} · ${nextSong.artist}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleFavorite(song.id)}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
              song.isFavorite
                ? 'text-rose-500 bg-rose-50 border-rose-200'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 border-slate-200'
            }`}
            title={song.isFavorite ? 'En favoritos' : 'Agregar a favoritos'}
          >
            <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
          </button>

          {isAdmin && (
            <button
              id="detail-edit-song-btn"
              type="button"
              onClick={() => onEdit(song)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              title="Editar canción (Modo Modificar)"
            >
              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      {/* Song Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <FileText className="w-3.5 h-3.5 text-rose-600" /> Partitura PDF
              </span>
              {song.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                {song.title}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {song.artist}
            </h1>
          </div>

          {/* Quick PDF Action: Open PDF (replaces old "Pantalla Completa") */}
          {song.pdfUrl && (
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <button
                type="button"
                onClick={handleOpenPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#b31942] hover:bg-[#991538] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                title="Abrir archivo PDF"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA: EXCLUSIVELY PDF VIEWER */}
      {song.pdfUrl ? (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                {song.pdfFileName || `${song.title} - ${song.artist}.pdf`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenPdf}
              className="text-[#b31942] hover:text-[#991538] font-bold text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer shrink-0 ml-2"
              title="Abrir PDF en pestaña independiente"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir PDF</span>
            </button>
          </div>

          {/* PDF Frame */}
          <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[650px] h-[78vh] relative">
            {pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                title={`Partitura PDF - ${song.title} ${song.artist}`}
                className="w-full h-full border-none"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="w-12 h-12 text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Cargando partitura PDF...
                </p>
                <button
                  type="button"
                  onClick={handleOpenPdf}
                  className="px-4 py-2 rounded-xl bg-[#b31942] text-white text-xs font-bold"
                >
                  Abrir PDF
                </button>
              </div>
            )}
          </div>

          {/* Direct open notice bar */}
          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <span>Visualización de partitura PDF directa en el cancionero.</span>
            <button
              type="button"
              onClick={handleOpenPdf}
              className="text-[#b31942] hover:text-[#991538] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir PDF en visor externo</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State when song does not have a PDF uploaded */
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-14 shadow-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            Partitura en PDF no disponible
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Esta canción ({song.title} - {song.artist}) todavía no tiene un archivo PDF de partitura cargado.
          </p>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => onEdit(song)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#b31942] hover:bg-[#991538] text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>Subir archivo PDF para esta canción</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la lista de canciones</span>
            </button>
          )}
        </div>
      )}

      {/* Footer Info & Quick Back */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#b31942]" />
          <span>CANCIONERO SALESIANO</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-[#b31942] hover:text-[#991538] font-semibold cursor-pointer"
        >
          Volver a la lista de canciones ↑
        </button>
      </div>

    </div>
  );
};
