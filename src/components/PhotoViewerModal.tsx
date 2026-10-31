import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface PhotoViewerModalProps {
  fotoUrl: string | null;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ fotoUrl, onClose }) => {
  if (!fotoUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3.5 bg-slate-800 text-white border-b border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
            <ZoomIn className="w-4 h-4" /> Comprovante Fotográfico do Rótulo
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 bg-black flex items-center justify-center overflow-auto max-h-[80vh]">
          <img
            src={fotoUrl}
            alt="Foto do produto em alta resolução"
            className="max-h-[75vh] w-auto object-contain rounded"
          />
        </div>
        <div className="p-2.5 bg-slate-900 text-center text-xs text-slate-400">
          Pressione ESC ou clique fora para fechar
        </div>
      </div>
    </div>
  );
};
