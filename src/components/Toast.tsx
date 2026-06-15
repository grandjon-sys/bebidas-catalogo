'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro';
  onClose: () => void;
}

export function Toast({ mensagem, tipo, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                  px-5 py-4 rounded-2xl shadow-xl text-white max-w-sm w-[90vw]
                  ${tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500'}`}
    >
      {tipo === 'sucesso'
        ? <CheckCircle className="w-5 h-5 shrink-0" />
        : <XCircle className="w-5 h-5 shrink-0" />
      }
      <span className="text-sm font-medium flex-1">{mensagem}</span>
      <button
        onClick={onClose}
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}