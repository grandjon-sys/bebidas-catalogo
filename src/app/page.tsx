'use client';

import { useEffect, useState, useCallback } from 'react';
import { CatalogCard } from '@/components/CatalogCard';
import { ReservaModal } from '@/components/ReservaModal';
import { Toast } from '@/components/Toast';
import { Produto, ReservaFormData } from '@/types';
import { Beer, Search } from 'lucide-react';

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  const carregarProdutos = useCallback(async () => {
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(data);
    } catch {
      mostrarToast('Erro ao carregar produtos.', 'erro');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'erro') => {
    setToast({ mensagem, tipo });
  };

  const handleReservar = async (dados: ReservaFormData) => {
    if (!produtoSelecionado) return;

    const res = await fetch('/api/reservas/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_id: produtoSelecionado.id,
        ...dados,
      }),
    });

    const resultado = await res.json();

    if (resultado.sucesso) {
      mostrarToast(
        `✅ Reserva confirmada! ID: ${resultado.reserva_id?.substring(0, 8)}...`,
        'sucesso'
      );
      setProdutoSelecionado(null);
      carregarProdutos();
    } else {
      mostrarToast(resultado.erro || 'Erro ao reservar.', 'erro');
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-10">

      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-500 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Beer className="w-7 h-7" />
            <h1 className="text-xl font-black tracking-tight">
              Catálogo de Bebidas
            </h1>
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full bg-white/20 backdrop-blur placeholder:text-white/70 text-white
                         border border-white/30 rounded-xl py-2.5 pl-9 pr-4
                         focus:outline-none focus:bg-white focus:text-gray-800
                         focus:placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 pt-5">
        {carregando ? (
          // Skeleton loading
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-9 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Beer className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nenhum produto encontrado</p>
            {filtro && (
              <button
                onClick={() => setFiltro('')}
                className="text-orange-500 text-sm mt-2 underline"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {produtosFiltrados.map((produto) => (
              <CatalogCard
                key={produto.id}
                produto={produto}
                onReservar={setProdutoSelecionado}
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Faça sua reserva e entraremos em contato 🍺
        </p>
      </main>

      {/* Modal de reserva */}
      {produtoSelecionado && (
        <ReservaModal
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
          onConfirmar={handleReservar}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          mensagem={toast.mensagem}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}