import React from 'react';
import { Song } from '../types';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  song,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          ¿Eliminar canción del cancionero?
        </h3>
        
        <p className="text-sm text-slate-600 mb-4">
          Estás a punto de eliminar permanentemente:
          <br />
          <strong className="text-slate-900 text-base font-bold">"{song.title}"</strong> ({song.artist})
        </p>

        <p className="text-xs text-slate-400 mb-6 bg-slate-50 p-2 rounded-xl">
          Esta acción removerá la canción y sus acordes del catálogo local.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            id="confirm-delete-button"
            type="button"
            onClick={() => {
              onConfirm(song.id);
              onClose();
            }}
            className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sí, Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
