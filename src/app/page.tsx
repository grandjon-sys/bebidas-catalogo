'use client';

import { useEffect, useState, useMemo } from 'react';
import { CatalogCard } from '@/components/CatalogCard';
import { ReservaModal } from '@/components/ReservaModal';
import { Toast } from '@/components/Toast';
import { Produto, Categoria, ReservaFormData, ResultadoReserva } from '@/types';
import { Beer, Search } from 'lucide-react';

export default function Home() {
  const [produtos, setProdutos]         = useState<Produto[]>([]);
  const [categorias, setCategorias]     = useState<Categoria[]>([]);
  const [carregando, setCarregando]     = useState(true);
  const [busca, setBusca]               = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [toast, setToast]               = useState<{
    mensagem: string; tipo: 'sucesso' | 'erro'
  } | null>(null);

  // ✅ Carrega produtos e categorias juntos
  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const [resProdutos, resCategorias] = await Promise.all([
          fetch('/api/produtos'),
          fetch('/api/categorias'),
        ]);
        const [dataProdutos, dataCategorias] = await Promise.all([
          resProdutos.json(),
          resCategorias.json(),
        ]);
        setProdutos(Array.isArray(dataProdutos) ? dataProdutos : []);
        setCategorias(Array.isArray(dataCategorias) ? dataCategorias : []);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // ✅ Filtra por busca e categoria
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase());
      const categoriaOk = categoriaAtiva === null || p.categoria_id === categoriaAtiva;
      return buscaOk && categoriaOk;
    });
  }, [produtos, busca, categoriaAtiva]);

  // ✅ Só exibe categorias que têm pelo menos 1 produto
  const categoriasComProdutos = useMemo(() => {
    const idsComProduto = new Set(produtos.map((p) => p.categoria_id));
    return categorias.filter((c) => idsComProduto.has(c.id));
  }, [categorias, produtos]);

  const handleReservar = async (dados: ReservaFormData): Promise<void> => {
    if (!produtoSelecionado) return;

    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_id:     produtoSelecionado.id,
        nome_comprador: dados.nome_comprador,
        telefone:       dados.telefone,
        quantidade:     dados.quantidade,
      }),
    });

    const resultado: ResultadoReserva = await res.json();

    if (resultado.sucesso) {
      setToast({ mensagem: '✅ Reserva confirmada!', tipo: 'sucesso' });
      setProdutoSelecionado(null);
      // Atualiza estoque localmente
      setProdutos((prev) =>
        prev.map((p) =>
          p.id === produtoSelecionado.id
            ? { ...p, estoque: p.estoque - dados.quantidade }
            : p
        )
      );
    } else {
      setToast({ mensagem: resultado.erro ?? 'Erro ao reservar.', tipo: 'erro' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Beer className="w-7 h-7 text-amber-400 shrink-0" />
          <div>
            <h1 className="font-black text-xl leading-none">Catálogo de Bebidas</h1>
            <p className="text-white/60 text-xs">Reserve suas favoritas!</p>
          </div>
        </div>

        {/* Busca */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar bebida..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-gray-800
                         text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* ✅ Filtro de categorias */}
        {categoriasComProdutos.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">

            {/* Botão "Todos" */}
            <button
              onClick={() => setCategoriaAtiva(null)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full
                          transition-all border
                          ${categoriaAtiva === null
                            ? 'bg-amber-400 border-amber-400 text-gray-900'
                            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                          }`}
            >
              🍾 Todos ({produtos.length})
            </button>

            {/* Botões de cada categoria */}
            {categoriasComProdutos.map((cat) => {
              const total = produtos.filter((p) => p.categoria_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full
                              transition-all border
                              ${categoriaAtiva === cat.id
                                ? 'bg-amber-400 border-amber-400 text-gray-900'
                                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                              }`}
                >
                  {cat.nome} ({total})
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 pt-5">
        {carregando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
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
          <div className="text-center py-20 text-gray-400">
            <Beer className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-lg">Nenhum produto encontrado</p>
            {(busca || categoriaAtiva) && (
              <button
                onClick={() => { setBusca(''); setCategoriaAtiva(null); }}
                className="mt-3 text-amber-500 underline text-sm"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {produtosFiltrados.map((produto) => (
              <CatalogCard
                key={produto.id}
                produto={produto}
                onReservar={setProdutoSelecionado}
              />
            ))}
          </div>
        )}
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