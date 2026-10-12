import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { getPdfBlobUrl, openPdfDirectly } from '../utils/pdfViewer';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

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

  // Zoom scale state for PDF rendering
  const [scale, setScale] = useState<number>(1.25);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);
  const [pdfjsReady, setPdfjsReady] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Safe blob URL for native iframe fallback
  const pdfBlobUrl = useMemo(() => {
    return song.pdfUrl ? getPdfBlobUrl(song.pdfUrl) : null;
  }, [song.pdfUrl]);

  // Check if PDF.js is available in window
  useEffect(() => {
    const checkPdfJs = () => {
      if (window.pdfjsLib) {
        setPdfjsReady(true);
      } else {
        // Retry a few times in case script is loading from CDN
        const timer = setTimeout(checkPdfJs, 200);
        return () => clearTimeout(timer);
      }
    };
    checkPdfJs();
  }, []);

  // Render PDF using PDF.js onto HTML5 Canvases for 100% Android & Mobile compatibility
  useEffect(() => {
    if (!song.pdfUrl || !pdfjsReady || !window.pdfjsLib) {
      if (!song.pdfUrl) {
        setIsLoadingPdf(false);
      }
      return;
    }

    let isCancelled = false;
    setIsLoadingPdf(true);
    setPdfRenderError(null);

    const renderPdf = async () => {
      try {
        let loadingTask: any;

        if (song.pdfUrl!.startsWith('data:')) {
          // Convert base64 data URI to Uint8Array for PDF.js
          const base64Str = song.pdfUrl!.includes(',')
            ? song.pdfUrl!.split(',')[1]
            : song.pdfUrl!;
          const cleanBase64 = base64Str.replace(/\s+/g, '');
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          loadingTask = window.pdfjsLib.getDocument({ data: bytes });
        } else if (pdfBlobUrl) {
          loadingTask = window.pdfjsLib.getDocument(pdfBlobUrl);
        } else {
          loadingTask = window.pdfjsLib.getDocument(song.pdfUrl);
        }

        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        setNumPages(pdfDoc.numPages);

        const container = canvasContainerRef.current;
        if (!container) return;

        // Clear existing canvases
        container.innerHTML = '';

        // Determine responsive base scale
        const containerWidth = container.clientWidth || window.innerWidth - 40;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (isCancelled) break;

          const page = await pdfDoc.getPage(pageNum);
          if (isCancelled) break;

          // Auto-fit scale relative to container width
          const unscaledViewport = page.getViewport({ scale: 1.0 });
          const targetWidth = Math.min(containerWidth - 32, 900);
          const baseScale = targetWidth / unscaledViewport.width;
          const finalScale = baseScale * scale;

          const viewport = page.getViewport({ scale: finalScale });

          // Support High-DPI (Retina/Mobile) crisp rendering
          const pixelRatio = window.devicePixelRatio || 1;

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'mb-6 flex flex-col items-center shadow-md rounded-xl overflow-hidden bg-white border border-slate-200';

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.className = 'block max-w-full';

          pageWrapper.appendChild(canvas);

          // Page indicator badge if multi-page
          if (pdfDoc.numPages > 1) {
            const pageBadge = document.createElement('div');
            pageBadge.className = 'text-[11px] font-medium text-slate-500 py-1.5 bg-slate-50 w-full text-center border-t border-slate-100';
            pageBadge.innerText = `Página ${pageNum} de ${pdfDoc.numPages}`;
            pageWrapper.appendChild(pageBadge);
          }

          container.appendChild(pageWrapper);

          const canvasContext = canvas.getContext('2d');
          if (canvasContext) {
            if (pixelRatio !== 1) {
              canvasContext.scale(pixelRatio, pixelRatio);
            }
            await page.render({
              canvasContext,
              viewport,
            }).promise;
          }
        }

        if (!isCancelled) {
          setIsLoadingPdf(false);
        }
      } catch (err: any) {
        console.error('[SongDetailView] Error rendering PDF with PDF.js:', err);
        if (!isCancelled) {
          setPdfRenderError(err?.message || 'Error al procesar el archivo PDF');
          setIsLoadingPdf(false);
        }
      }
    };

    renderPdf();

    return () => {
      isCancelled = true;
    };
  }, [song.pdfUrl, scale, pdfjsReady, pdfBlobUrl]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setScale(1.25);

  const handleOpenExternal = () => {
    if (song.pdfUrl) {
      openPdfDirectly(song.pdfUrl, song.pdfFileName);
    }
  };

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      
      {/* Top Header: Volver al Catálogo + Song navigation */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 pb-3 border-b border-slate-200">
        
        {/* Prominent Back to Catalog Button */}
        <button
          id="btn-back-to-catalog"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#b31942]" />
          <span>Volver al Catálogo</span>
        </button>

        {/* Prev / Next Song Navigation & Favorite */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {prevSong && (
            <button
              type="button"
              onClick={() => setSelectedSong(prevSong)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              title={`Canto anterior: ${prevSong.title} - ${prevSong.artist}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {nextSong && (
            <button
              type="button"
              onClick={() => setSelectedSong(nextSong)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              title={`Siguiente canto: ${nextSong.title} - ${nextSong.artist}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleFavorite(song.id)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              song.isFavorite
                ? 'text-rose-500 bg-rose-50 border-rose-200'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 border-slate-200'
            }`}
            title={song.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onEdit(song)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              title="Editar canción (Admin)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}
        </div>
      </div>

      {/* Song Title & Information Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                {song.title}
              </span>
              {song.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {song.artist}
            </h1>
          </div>

          {/* Zoom controls for comfortable reading on Android & Desktop */}
          {song.pdfUrl && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Reducir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600 px-1 min-w-[42px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer ml-0.5"
                title="Restablecer tamaño normal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Score Area */}
      {song.pdfUrl ? (
        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-6 min-h-[500px]">
          
          {/* Loading Indicator */}
          {isLoadingPdf && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-8 h-8 text-[#b31942] animate-spin mb-3" />
              <p className="text-sm font-semibold">Cargando partitura...</p>
              <p className="text-xs text-slate-400 mt-1">Preparando visualización para tu dispositivo</p>
            </div>
          )}

          {/* Primary View: Canvas rendered via PDF.js (works 100% on Android, iOS, and PC) */}
          <div 
            ref={canvasContainerRef} 
            className={`flex flex-col items-center transition-opacity duration-200 ${isLoadingPdf ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}
          />

          {/* Fallback if PDF.js is unavailable or failed to render */}
          {!isLoadingPdf && pdfRenderError && (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 max-w-md mx-auto my-8">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Visualizador alternativo</h3>
              <p className="text-xs text-slate-500 mb-4">
                Puedes abrir el documento directamente o utilizar el visor nativo.
              </p>
              {pdfBlobUrl && (
                <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 mb-4">
                  <iframe
                    src={pdfBlobUrl}
                    title="Partitura"
                    className="w-full h-full border-none"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenExternal}
                className="px-4 py-2 bg-[#b31942] hover:bg-[#991538] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en visor externo</span>
              </button>
            </div>
          )}

          {/* Bottom Bar: Back to catalog button + Open in external viewer */}
          <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#b31942]" />
              <span>Volver al Catálogo</span>
            </button>

            <button
              type="button"
              onClick={handleOpenExternal}
              className="text-[#b31942] hover:text-[#991538] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en otra pestaña / lector PDF</span>
            </button>
          </div>

        </div>
      ) : (
        /* Empty state: No PDF attached */
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

          <div className="flex flex-wrap gap-2.5 justify-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#b31942]" />
              <span>Volver al Catálogo</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onEdit(song)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b31942] hover:bg-[#991538] text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Subir archivo PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
