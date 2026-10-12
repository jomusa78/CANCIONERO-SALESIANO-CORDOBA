import React from 'react';
import { Song, SearchMatchInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSongs } from '../context/SongContext';
import { 
  Heart, 
  Edit3, 
  Trash2,
  FileText
} from 'lucide-react';

interface SongCardProps {
  song: Song;
  searchInfo?: SearchMatchInfo;
  onSelect: (song: Song) => void;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  searchInfo,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { isAdmin } = useAuth();
  const { toggleFavorite, searchQuery } = useSongs();

  // Helper to highlight matching text in title or snippets
  const renderHighlighted = (text: string, query: string) => {
    if (!query || !query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div 
      id={`song-card-${song.id}`}
      onClick={() => onSelect(song)}
      className="group relative bg-white border border-slate-200 hover:border-[#b31942]/60 hover:shadow-md rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between cursor-pointer"
      title={`Hacer clic para ver partitura de ${song.artist}`}
    >
      <div>
        
        {/* Card Header: Number + Favorite Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200/80">
              {renderHighlighted(song.title, searchQuery)}
            </span>
            {song.pdfUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <FileText className="w-3 h-3 text-slate-400" /> Partitura
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(song.id);
            }}
            className={`p-1.5 rounded-full transition-colors ${
              song.isFavorite
                ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
            }`}
            title={song.isFavorite ? 'Quitar de favoritos' : 'Marcar favorito'}
          >
            <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Song Name / Title (Clicking opens the song) */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#b31942] transition-colors leading-snug">
            {renderHighlighted(song.artist, searchQuery)}
          </h3>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {song.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Semantic Lyric Match Snippet if matched inside lyrics */}
        {searchInfo?.snippet && (
          <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="italic text-slate-700 line-clamp-2 leading-relaxed font-serif">
              «{renderHighlighted(searchInfo.snippet, searchQuery)}»
            </p>
          </div>
        )}

      </div>

      {/* Admin actions (only visible to admin) */}
      {isAdmin && (
        <div 
          className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            id={`edit-song-${song.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(song);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Editar canción (Admin)"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            id={`delete-song-${song.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(song);
            }}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Eliminar canción (Admin)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};

export const SongListItem: React.FC<SongCardProps> = ({
  song,
  searchInfo,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { isAdmin } = useAuth();
  const { toggleFavorite, searchQuery } = useSongs();

  const renderHighlighted = (text: string, query: string) => {
    if (!query || !query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div 
      id={`song-list-item-${song.id}`}
      onClick={() => onSelect(song)}
      className="group bg-white border border-slate-200 hover:border-[#b31942]/60 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
      title={`Hacer clic para ver partitura de ${song.artist}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
            {renderHighlighted(song.title, searchQuery)}
          </span>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-[#b31942] transition-colors">
            {renderHighlighted(song.artist, searchQuery)}
          </h3>
          {song.pdfUrl && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              <FileText className="w-3 h-3 text-slate-400" /> Partitura
            </span>
          )}
        </div>

        {searchInfo?.snippet ? (
          <p className="text-xs text-amber-900 bg-amber-50/70 p-1.5 rounded-md border border-amber-200/50 mb-2 italic">
            «{renderHighlighted(searchInfo.snippet, searchQuery)}»
          </p>
        ) : null}

        <div className="flex items-center gap-1.5 flex-wrap">
          {song.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => toggleFavorite(song.id)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            song.isFavorite
              ? 'text-rose-500 bg-rose-50'
              : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
          }`}
          title="Favorito"
        >
          <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onEdit(song)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(song)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
