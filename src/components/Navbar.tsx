import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSongs } from '../context/SongContext';
import { SalesianosLogo } from './SalesianosLogo';
import { 
  ShieldCheck, 
  Plus, 
  Settings, 
  LogOut, 
  KeyRound,
  BookOpen,
  Search,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, isAdmin, logout, openAuthModal } = useAuth();
  const { 
    setIsAdminPanelOpen, 
    setEditingSong, 
    setSelectedSong,
    searchQuery,
    setSearchQuery,
    selectedSong
  } = useSongs();

  const handleOpenAddSong = () => {
    setEditingSong(null);
    setIsAdminPanelOpen(true);
  };

  const handleCatalogClick = () => {
    setSelectedSong(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // If inside a song's detailed sheet, return to the catalog view to see matches
    if (selectedSong) {
      setSelectedSong(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Desktop & Tablet Row (and Mobile Top Row) */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo & Brand: CANCIONERO SALESIANO */}
          <div 
            id="nav-brand"
            onClick={handleCatalogClick}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
            title="Ir al inicio - CANCIONERO SALESIANO"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white border border-rose-100 shadow-xs flex items-center justify-center p-1 group-hover:scale-105 transition-transform shrink-0">
              <SalesianosLogo className="w-full h-full" />
            </div>
            <div>
              <span className="text-sm xs:text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1">
                <span>CANCIONERO</span>
                <span className="text-[#b31942]">SALESIANO</span>
              </span>
              <p className="text-[10px] text-slate-500 hidden md:block leading-none mt-0.5">
                Letras, acordes y cantos para el camino
              </p>
            </div>
          </div>

          {/* Center/Main Area: Catálogo & Search Bar (Desktop / Tablet view) */}
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xl mx-2 lg:mx-4">
            {/* Catalog Button */}
            <button
              id="nav-btn-catalog"
              type="button"
              onClick={handleCatalogClick}
              className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
                !selectedSong && !searchQuery
                  ? 'bg-rose-50 text-[#b31942] border border-rose-200'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
              title="Ver catálogo completo de canciones"
            >
              <BookOpen className="w-4 h-4 text-[#b31942]" />
              <span>Catálogo</span>
            </button>

            {/* Search Input right beside "Catálogo" */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="nav-search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar por título, verso, letra o autor..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#b31942] rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-rose-500/10 transition-all"
              />
              {searchQuery && (
                <button
                  id="nav-search-clear-btn"
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions: Admin Access / Modo Total Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* IF IN MODO TOTAL (ADMINISTRATOR LOGGED IN) */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="nav-btn-admin-panel"
                  type="button"
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1"
                  title="Panel de Administración"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Panel Admin</span>
                </button>
                
                <button
                  id="nav-btn-new-song"
                  type="button"
                  onClick={handleOpenAddSong}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-white bg-[#b31942] hover:bg-[#991538] rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  title="Añadir nueva canción al cancionero"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Nueva Canción</span>
                </button>

                {/* Admin user active badge & logout */}
                <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    title="Modo Administrador Activo"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#b31942] shrink-0" />
                    <span className="text-xs font-bold hidden lg:inline">
                      Administrador
                    </span>
                  </button>

                  <button
                    id="nav-btn-logout-admin"
                    type="button"
                    onClick={logout}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Salir de Modo Total (Volver a Modo Lector)"
                    aria-label="Salir de Modo Total"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* MODO LECTOR (DEFAULT): ONLY ONE DISCREET KEY ICON FOR THE ADMINISTRATOR */
              <div className="flex items-center">
                <button
                  id="nav-btn-admin-icon"
                  type="button"
                  onClick={openAuthModal}
                  className="p-2 sm:p-2.5 text-slate-500 hover:text-[#b31942] hover:bg-rose-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center group"
                  title="Acceso Administrador del Grupo"
                  aria-label="Acceso Administrador del Grupo"
                >
                  <KeyRound className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#b31942] group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile View Second Row: Catálogo + Search Bar side-by-side */}
        <div className="sm:hidden flex items-center gap-2 pb-2.5 pt-0.5">
          {/* Catalog Button */}
          <button
            id="nav-btn-catalog-mobile"
            type="button"
            onClick={handleCatalogClick}
            className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 ${
              !selectedSong && !searchQuery
                ? 'bg-rose-50 text-[#b31942] border border-rose-200'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
            title="Catálogo"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#b31942]" />
            <span>Catálogo</span>
          </button>

          {/* Search Input right beside "Catálogo" on Mobile */}
          <div className="relative flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              id="nav-search-input-mobile"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar título, verso, letra..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-100 focus:bg-white border border-slate-200 focus:border-[#b31942] rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                title="Borrar"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
