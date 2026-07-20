'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imagemUrl: string;
  nome: string;
  onClose: () => void;
}

export function ImageModal({ imagemUrl, nome, onClose }: ImageModalProps) {
  // Fecha com a tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagemUrl}
        alt={nome}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
