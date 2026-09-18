import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SongProvider, useSongs } from './context/SongContext';
import { Navbar } from './components/Navbar';
import { SalesianosLogo } from './components/SalesianosLogo';
import { SongCard, SongListItem } from './components/SongCard';
import { SongDetailView } from './components/SongDetailView';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { Song } from './types';
import { 
  SearchX, 
  ArrowUpDown,
  LayoutGrid,
  List,
  BookOpen,
  X
} from 'lucide-react';

const MainCatalogView: React.FC = () => {
  const { 
    filteredResults, 
    viewMode, 
    setViewMode,
    sortBy,
    setSortBy,
    setSelectedSong, 
    setEditingSong, 
    setIsAdminPanelOpen,
    searchQuery,
    setSearchQuery,
    songs
  } = useSongs();
  
  const { isAdmin } = useAuth();
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const { deleteSong } = useSongs();

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setIsAdminPanelOpen(true);
  };

  const handleDeletePrompt = (song: Song) => {
    setSongToDelete(song);
  };

  return (
    <div>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Catalog Control Header: Count + Sort + Grid/List (No hero, no probar frases, no tag line) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
          
          {/* Left Title / Search Result indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#b31942]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              {searchQuery.trim() ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Resultados para <span className="text-[#b31942]">«{searchQuery}»</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    {filteredResults.length} {filteredResults.length === 1 ? 'canto' : 'cantos'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 hover:underline ml-1"
                    title="Ver todas las canciones"
                  >
                    <X className="w-3 h-3" /> Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Catálogo de Canciones
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {songs.length} cantos
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Sort & Grid/List View Mode */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 hidden sm:inline">Ordenar:</span>
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'title' | 'artist' | 'recent')}
                aria-label="Ordenar canciones"
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="title">Título (A-Z)</option>
                <option value="artist">Artista / Autor (A-Z)</option>
                <option value="recent">Más recientes</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid / List */}
            <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200">
              <button
                id="view-mode-grid"
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#b31942] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en cuadrícula"
                aria-label="Vista en cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                id="view-mode-list"
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-[#b31942] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en lista"
                aria-label="Vista en lista"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* If no songs match search query */}
        {filteredResults.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center max-w-lg mx-auto shadow-xs my-4 sm:my-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 text-[#b31942] flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <SearchX className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              No se encontraron canciones
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 sm:mb-6">
              No hubo coincidencias en títulos, artistas o estrofas para <strong className="text-slate-800">«{searchQuery}»</strong>.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 sm:px-4 py-2 bg-[#b31942] hover:bg-[#991538] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs"
              >
                Ver todo el catálogo
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSong(null);
                    setIsAdminPanelOpen(true);
                  }}
                  className="px-3.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                >
                  + Añadir esta canción
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            
            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {filteredResults.map(({ song, searchInfo }) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    searchInfo={searchInfo}
                    onSelect={s => setSelectedSong(s)}
                    onEdit={handleEditSong}
                    onDelete={handleDeletePrompt}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2.5 sm:space-y-3">
                {filteredResults.map(({ song, searchInfo }) => (
                  <SongListItem
                    key={song.id}
                    song={song}
                    searchInfo={searchInfo}
                    onSelect={s => setSelectedSong(s)}
                    onEdit={handleEditSong}
                    onDelete={handleDeletePrompt}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(songToDelete)}
        song={songToDelete}
        onClose={() => setSongToDelete(null)}
        onConfirm={id => deleteSong(id)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { 
    selectedSong, 
    setSelectedSong, 
    isAdminPanelOpen, 
    setIsAdminPanelOpen,
    setEditingSong,
    deleteSong
  } = useSongs();
  
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-rose-100 selection:text-rose-900">
      
      {/* Top Navigation with Salesianos branding & search bar next to Catalogo */}
      <Navbar />

      {/* Main View: Song Detail or Catalog */}
      <div className="flex-1">
        {selectedSong ? (
          <SongDetailView
            song={selectedSong}
            onBack={() => setSelectedSong(null)}
            onEdit={s => {
              setEditingSong(s);
              setIsAdminPanelOpen(true);
            }}
          />
        ) : (
          <MainCatalogView />
        )}
      </div>

      {/* Admin Panel Modal (CRUD for Administrator role) */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onConfirmDelete={song => setSongToDelete(song)}
      />

      {/* Auth Modal (Exclusive Administrator access) */}
      <AuthModal />

      {/* Global Delete Confirm for Admin inside Detail/Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(songToDelete)}
        song={songToDelete}
        onClose={() => setSongToDelete(null)}
        onConfirm={id => deleteSong(id)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-rose-200 flex items-center justify-center p-0.5">
              <SalesianosLogo className="w-full h-full" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight">CANCIONERO SALESIANO</span>
            <span className="text-slate-400">· Córdoba</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <span>Buscador integrado</span>
            <span>·</span>
            <span>Acordes y transposición</span>
            <span>·</span>
            <span>Gestión del catálogo</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SongProvider>
        <AppContent />
      </SongProvider>
    </AuthProvider>
  );
}
