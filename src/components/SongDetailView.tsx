import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSongs } from '../context/SongContext';
import { 
  parseSongContent, 
  transposeNote, 
  extractPlainLyrics 
} from '../utils/chordUtils';
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  RotateCcw, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Printer, 
  Eye, 
  EyeOff, 
  Heart, 
  Edit3, 
  Music2, 
  Share2,
  ChevronLeft,
  ChevronRight,
  Clock,
  KeyRound
} from 'lucide-react';

interface SongDetailViewProps {
  song: Song;
  onBack: () => void;
  onEdit: (song: Song) => void;
}

export const SongDetailView: React.FC<SongDetailViewProps> = ({ song, onBack, onEdit }) => {
  const { isAdmin } = useAuth();
  const { songs, setSelectedSong, toggleFavorite } = useSongs();

  // Transpose state in semitones (-11 to +11)
  const [semitones, setSemitones] = useState(0);
  // Chord visibility toggle
  const [showChords, setShowChords] = useState(true);
  // Font size multiplier
  const [fontSizeLevel, setFontSizeLevel] = useState(2); // 1: small, 2: normal, 3: large, 4: extra large
  // Autoscroll state
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1 to 5
  // Copy notification state
  const [copied, setCopied] = useState(false);

  const scrollIntervalRef = useRef<number | null>(null);

  // Reset transposition when song changes
  useEffect(() => {
    setSemitones(0);
    setIsScrolling(false);
  }, [song.id]);

  // Autoscroll effect
  useEffect(() => {
    if (isScrolling) {
      scrollIntervalRef.current = window.setInterval(() => {
        window.scrollBy({
          top: scrollSpeed * 1.5,
          behavior: 'smooth',
        });
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  // Current calculated musical tonality
  const currentKey = transposeNote(song.originalKey, semitones);

  // Parse lines with chords transposed
  const parsedLines = parseSongContent(song.content, semitones);

  // Navigation between songs
  const currentIndex = songs.findIndex(s => s.id === song.id);
  const prevSong = currentIndex > 0 ? songs[currentIndex - 1] : null;
  const nextSong = currentIndex < songs.length - 1 ? songs[currentIndex + 1] : null;

  const handleCopyLyrics = async () => {
    const plain = extractPlainLyrics(song.content);
    const textToCopy = `${song.title} - ${song.artist}\nTono: ${song.originalKey}\n\n${plain}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Font size classes
  const fontSizes = [
    'text-sm leading-relaxed',
    'text-base leading-relaxed',
    'text-lg leading-relaxed',
    'text-xl leading-relaxed',
    'text-2xl leading-relaxed',
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200">
        <button
          id="btn-back-to-catalog"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Volver al Catálogo</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {prevSong && (
            <button
              type="button"
              onClick={() => setSelectedSong(prevSong)}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title={`Anterior: ${prevSong.title}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {nextSong && (
            <button
              type="button"
              onClick={() => setSelectedSong(nextSong)}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title={`Siguiente: ${nextSong.title}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleFavorite(song.id)}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
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
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors"
              title="Editar canción (Modo Total)"
            >
              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      {/* Song Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {song.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {song.title}
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-600 mt-0.5">
              {song.artist}
            </p>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs sm:text-sm font-bold font-mono-chord border border-amber-200 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>Tono: {currentKey}</span>
                {semitones !== 0 && (
                  <span className="text-[11px] text-amber-700">
                    ({semitones > 0 ? `+${semitones}` : semitones})
                  </span>
                )}
              </span>
            </div>
            {song.bpm && (
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" /> {song.bpm} BPM · {song.timeSignature || '4/4'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Musician Interactive Toolbar (Sticky for live performance) */}
      <div className="sticky top-14 sm:top-16 z-20 bg-slate-900 text-white rounded-xl sm:rounded-2xl p-2 sm:p-3.5 shadow-xl mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        
        {/* Transposer */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-300 hidden sm:inline mr-1">
            Transponer:
          </span>
          <button
            id="transpose-down-btn"
            type="button"
            onClick={() => setSemitones(prev => prev - 1)}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Bajar medio tono (-1 semitono)"
          >
            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          <div className="px-2.5 sm:px-3 py-1 bg-slate-800 rounded-lg text-xs sm:text-sm font-bold font-mono-chord text-amber-400 min-w-[42px] sm:min-w-[50px] text-center border border-slate-700">
            {currentKey}
          </div>

          <button
            id="transpose-up-btn"
            type="button"
            onClick={() => setSemitones(prev => prev + 1)}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Subir medio tono (+1 semitono)"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {semitones !== 0 && (
            <button
              type="button"
              onClick={() => setSemitones(0)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Restablecer al tono original"
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

        {/* Chords Visibility Toggle & Font Size */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowChords(prev => !prev)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              showChords
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {showChords ? <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span className="text-[11px] sm:text-xs">{showChords ? 'Acordes ON' : 'Solo Letra'}</span>
          </button>

          {/* Font size */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setFontSizeLevel(prev => Math.max(0, prev - 1))}
              disabled={fontSizeLevel === 0}
              className="px-1.5 py-0.5 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30"
              title="Reducir tamaño de letra"
            >
              A-
            </button>
            <span className="text-[10px] text-slate-400 px-1 font-mono">
              {fontSizeLevel + 1}
            </span>
            <button
              type="button"
              onClick={() => setFontSizeLevel(prev => Math.min(fontSizes.length - 1, prev + 1))}
              disabled={fontSizeLevel === fontSizes.length - 1}
              className="px-1.5 py-0.5 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30"
              title="Aumentar tamaño de letra"
            >
              A+
            </button>
          </div>
        </div>

        {/* Autoscroll Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="autoscroll-toggle-btn"
            type="button"
            onClick={() => setIsScrolling(prev => !prev)}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              isScrolling
                ? 'bg-emerald-500 text-slate-950 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Desplazamiento automático para tocar instrumentos sin tocar la pantalla"
          >
            {isScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-[11px] sm:text-xs">{isScrolling ? 'Pausar' : 'Auto-scroll'}</span>
          </button>

          {isScrolling && (
            <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded-lg">
              <span className="text-[9px] text-slate-400">Vel:</span>
              <button
                type="button"
                onClick={() => setScrollSpeed(prev => Math.max(1, prev - 1))}
                className="text-xs px-1 text-slate-300 hover:text-white"
              >
                -
              </button>
              <span className="text-xs font-bold text-amber-400">{scrollSpeed}x</span>
              <button
                type="button"
                onClick={() => setScrollSpeed(prev => Math.min(5, prev + 1))}
                className="text-xs px-1 text-slate-300 hover:text-white"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Utilities: Copy & Print */}
        <div className="flex items-center gap-1 sm:gap-1.5 border-l border-slate-700 pl-1.5 sm:pl-2">
          <button
            type="button"
            onClick={handleCopyLyrics}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Copiar letra limpia"
          >
            {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors hidden xs:block sm:block"
            title="Imprimir canción"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>

      {/* Copy notification toast */}
      {copied && (
        <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium rounded-xl text-center shadow-xs animate-in fade-in">
          ¡Letra copiada al portapapeles con éxito!
        </div>
      )}

      {/* Musical Sheet & Lyrics Content */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-10 shadow-xs print:border-none print:shadow-none">
        
        <div className={`font-sans ${fontSizes[fontSizeLevel]} space-y-4`}>
          {parsedLines.map((line, lineIndex) => {
            // If it's a section header like [Coro] or [Verso 1]
            if (line.isSectionHeader) {
              return (
                <div 
                  key={lineIndex} 
                  className="pt-4 pb-1 border-b border-slate-100"
                >
                  <span className="inline-block px-3 py-1 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {line.headerName}
                  </span>
                </div>
              );
            }

            // Check if line is empty (empty line separator between stanzas)
            const isAllEmpty = line.segments.every(s => !s.chord && !s.text.trim());
            if (isAllEmpty) {
              return <div key={lineIndex} className="h-4" />;
            }

            // Regular line: syllables with chords directly positioned above!
            return (
              <div 
                key={lineIndex} 
                className="flex flex-wrap items-end gap-x-1.5 leading-none py-0.5"
              >
                {line.segments.map((seg, segIndex) => (
                  <span 
                    key={segIndex} 
                    className="inline-flex flex-col items-start whitespace-pre"
                  >
                    {/* Musical Chord above syllable */}
                    {showChords && (
                      <span className="font-mono-chord font-bold text-amber-700 text-[0.85em] min-h-[1.25em] select-all">
                        {seg.chord || ''}
                      </span>
                    )}

                    {/* Lyric syllable */}
                    <span className="text-slate-900 font-medium select-text">
                      {seg.text || ' '}
                    </span>
                  </span>
                ))}
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer Info & Quick Back */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-amber-600" />
          <span>Cancionero Digital · Tonalidad original: <strong>{song.originalKey}</strong></span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-amber-700 hover:text-amber-900 font-semibold"
        >
          Volver a la lista de canciones ↑
        </button>
      </div>

    </div>
  );
};
