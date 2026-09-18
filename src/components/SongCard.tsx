import React from 'react';
import { Song, SearchMatchInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSongs } from '../context/SongContext';
import { 
  Music, 
  Heart, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  FileText,
  Clock,
  KeyRound
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
      className="group relative bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        
        {/* Card Header: Tonality & Favorite */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono-chord">
              <KeyRound className="w-3 h-3 text-amber-600" /> Tono: {song.originalKey}
            </span>
            {song.bpm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" /> {song.bpm} BPM
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

        {/* Title & Artist */}
        <div 
          onClick={() => onSelect(song)}
          className="cursor-pointer mb-3"
        >
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug">
            {renderHighlighted(song.title, searchQuery)}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {renderHighlighted(song.artist, searchQuery)}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
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
          <div className="mb-4 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
            <div className="flex items-center gap-1 font-semibold text-[11px] text-amber-800 uppercase tracking-wider mb-1">
              <FileText className="w-3 h-3" /> Coincidencia en la letra:
            </div>
            <p className="italic text-slate-700 line-clamp-2 leading-relaxed font-serif">
              «{renderHighlighted(searchInfo.snippet, searchQuery)}»
            </p>
          </div>
        )}

      </div>

      {/* Card Footer: Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        
        <button
          id={`view-song-${song.id}`}
          type="button"
          onClick={() => onSelect(song)}
          className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <Music className="w-3.5 h-3.5" />
          <span>Ver acordes y letra</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>

        {/* Admin CRUD controls */}
        {isAdmin && (
          <div className="flex items-center gap-1">
            <button
              id={`edit-song-${song.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(song);
              }}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
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
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Eliminar canción (Admin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

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
      className="group bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
            {renderHighlighted(song.title, searchQuery)}
          </h3>
          <span className="text-slate-400 font-medium">·</span>
          <span className="text-sm text-slate-500 font-medium">
            {renderHighlighted(song.artist, searchQuery)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono-chord">
            {song.originalKey}
          </span>
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
          {song.bpm && (
            <span className="text-[10px] text-slate-400">
              {song.bpm} BPM
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => toggleFavorite(song.id)}
          className={`p-2 rounded-lg transition-colors ${
            song.isFavorite
              ? 'text-rose-500 bg-rose-50'
              : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
          }`}
          title="Favorito"
        >
          <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => onSelect(song)}
          className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1"
        >
          <Music className="w-3.5 h-3.5" />
          <span>Ver</span>
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onEdit(song)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(song)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
