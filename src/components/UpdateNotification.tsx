import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { checkServerVersion, forceHardReload, setupVersionGuards } from '../utils/versionCheck';

export const UpdateNotification: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [justCheckedSuccess, setJustCheckedSuccess] = useState(false);

  useEffect(() => {
    // Setup background guards & periodic listeners
    const cleanup = setupVersionGuards(() => {
      setHasUpdate(true);
    });
    return cleanup;
  }, []);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    await forceHardReload();
  };

  const handleManualCheck = async () => {
    setIsCheckingManual(true);
    const result = await checkServerVersion();
    setIsCheckingManual(false);
    if (result.hasUpdate) {
      setHasUpdate(true);
    } else {
      setJustCheckedSuccess(true);
      setTimeout(() => setJustCheckedSuccess(false), 3000);
    }
  };

  if (!hasUpdate && !justCheckedSuccess) {
    return null;
  }

  if (justCheckedSuccess && !hasUpdate) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="bg-emerald-900/90 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>¡Ya tienes la versión más reciente del proyecto!</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="project-update-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Nueva versión del proyecto</span>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 font-extrabold uppercase px-1.5 py-0.5 rounded">
                  Actualización
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Se han publicado cambios recientes en el cancionero. Actualiza para ver la última versión.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHasUpdate(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            id="btn-force-update-now"
            disabled={isUpdating}
            onClick={handleUpdateNow}
            className="flex-1 py-2 px-3 bg-[#b31942] hover:bg-[#991538] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Cargando última versión...' : 'Cargar última versión ahora'}</span>
          </button>

          <button
            type="button"
            onClick={() => setHasUpdate(false)}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
};
