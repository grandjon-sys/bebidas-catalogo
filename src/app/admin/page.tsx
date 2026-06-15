'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminProdutoForm } from '@/components/AdminProdutoForm';
import { Toast } from '@/components/Toast';
import { Produto } from '@/types';
import {
  Settings, Plus, Edit2, Trash2,
  Package, Eye, EyeOff, ClipboardList
} from 'lucide-react';
import Link from 'next/link';

const SENHA_KEY = 'admin_senha';

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Recupera senha salva na sessão (para não redigitar toda vez)
  const getSenha = () => sessionStorage.getItem(SENHA_KEY) ?? '';

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-password': getSenha(),
  }), []);

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'erro') =>
    setToast({ mensagem, tipo });

  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    try {
      // Admin vê todos (incluindo inativos via service_role)
      const res = await fetch('/api/produtos', { headers: headers() });
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch {
      mostrarToast('Erro ao carregar.', 'erro');
    } finally {
      setCarregando(false);
    }
  }, [headers]);

  useEffect(() => {
    if (autenticado) carregarProdutos();
  }, [autenticado, carregarProdutos]);

  const handleLogin = async () => {
  setErroSenha('');
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: senhaInput }),
    });

    if (res.ok) {
      sessionStorage.setItem(SENHA_KEY, senhaInput);
      setAutenticado(true);
    } else {
      setErroSenha('Senha incorreta.');
    }
  } catch {
    setErroSenha('Erro ao conectar. Tente novamente.');
  }
};

  const handleSalvar = async (dados: Omit<Produto, 'id' | 'criado_em' | 'ativo'>) => {
    const isEdicao = !!produtoEditando;
    const url = isEdicao ? `/api/produtos/${produtoEditando!.id}` : '/api/produtos';
    const method = isEdicao ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: headers(),
      body: JSON.stringify(dados),
    });

    if (res.ok) {
      mostrarToast(
        isEdicao ? 'Produto atualizado!' : 'Produto criado!',
        'sucesso'
      );
      setMostrarForm(false);
      setProdutoEditando(null);
      carregarProdutos();
    } else {
      mostrarToast('Erro ao salvar produto.', 'erro');
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!confirm(`Desativar "${nome}"?`)) return;
    const res = await fetch(`/api/produtos/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (res.ok) {
      mostrarToast('Produto desativado.', 'sucesso');
      carregarProdutos();
    } else {
      mostrarToast('Erro ao desativar.', 'erro');
    }
  };

  // --- Tela de login ---
  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <Settings className="w-12 h-12 text-brand-500 mx-auto mb-2" />
            <h1 className="font-black text-2xl text-gray-800">Admin</h1>
            <p className="text-gray-500 text-sm">Acesso restrito</p>
          </div>
          <input
            type="password"
            placeholder="Senha"
            className="input-field mb-3"
            value={senhaInput}
            onChange={(e) => setSenhaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {erroSenha && (
            <p className="text-red-500 text-sm mb-3 text-center">{erroSenha}</p>
          )}
          <button onClick={handleLogin} className="btn-primary w-full">
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // --- Painel Admin ---
  return (
    <div className="min-h-screen pb-10">
      <header className="bg-gray-800 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h1 className="font-bold text-lg">Painel Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/reservas"
              className="flex items-center gap-1 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Reservas
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Ver site
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Botão novo produto */}
        {!mostrarForm && !produtoEditando && (
          <button
            onClick={() => setMostrarForm(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Produto
          </button>
        )}

        {/* Formulário */}
        {(mostrarForm || produtoEditando) && (
          <AdminProdutoForm
            produtoEditando={produtoEditando}
            onSalvar={handleSalvar}
            onCancelar={() => {
              setMostrarForm(false);
              setProdutoEditando(null);
            }}
          />
        )}

        {/* Lista de produtos */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
            Produtos ({produtos.length})
          </h2>

          {carregando ? (
            <p className="text-gray-400 text-center py-8">Carregando...</p>
          ) : (
            produtos.map((produto) => (
              <div
                key={produto.id}
                className={`bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3
                  ${!produto.ativo ? 'border-red-200 opacity-60' : 'border-gray-100'}`}
              >
                {/* Ícone */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{produto.nome}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {produto.preco && (
                      <span className="text-brand-600 text-sm font-bold">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium flex items-center gap-1
                        ${produto.estoque === 0 ? 'text-red-500' : 'text-green-600'}`}
                    >
                      <Package className="w-3 h-3" />
                      {produto.estoque} un.
                    </span>
                    {!produto.ativo && (
                      <span className="text-xs text-red-400 font-medium">Inativo</span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setProdutoEditando(produto);
                      setMostrarForm(false);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExcluir(produto.id, produto.nome)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-400"
                    title="Desativar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

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