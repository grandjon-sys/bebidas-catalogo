'use client';

import { useEffect, useState } from 'react';
import { Search, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const SENHA_KEY = 'admin_senha';

interface ItemRelatorio {
  produto: string;
  quantidade: number;
  valor: number;
  valorTotal: number;
}

interface ClienteRelatorio {
  nome: string;
  telefone: string;
  itens: ItemRelatorio[];
  subtotal: number;
}

export default function RelatoriosPage() {
  const [senha, setSenha] = useState<string | null>(null);
  const [telefone, setTelefone] = useState('');
  const [status, setStatus] = useState(''); // '' = todos
  const [clientes, setClientes] = useState<ClienteRelatorio[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [buscou, setBuscou] = useState(false);

  // Lê a senha já salva pelo login do painel admin (não pede de novo)
  useEffect(() => {
    setSenha(sessionStorage.getItem(SENHA_KEY));
  }, []);

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const gerarRelatorio = async () => {
    if (!senha) return;

    setCarregando(true);
    setErro('');
    setBuscou(true);

    try {
      const params = new URLSearchParams();
      if (telefone.trim()) params.set('telefone', telefone.trim());
      if (status) params.set('status', status);

      const res = await fetch(`/api/relatorios?${params.toString()}`, {
        headers: { 'x-admin-password': senha },
      });

      if (res.status === 401) {
        setErro('Sessão expirada. Volte ao painel admin e faça login novamente.');
        return;
      }

      if (!res.ok) {
        setErro('Erro ao gerar relatório. Tente novamente.');
        return;
      }

      const data = await res.json();
      setClientes(data.clientes);
      setTotalGeral(data.totalGeral);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // Se ainda não tem senha na sessão, manda voltar pro login do painel
  if (senha === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm text-center">
          <p className="text-gray-600 text-sm mb-4">
            Você precisa estar logado no painel admin para acessar os relatórios.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600
                       text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir para o painel admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho e filtros — não aparece na impressão */}
        <div className="print:hidden mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Voltar ao painel"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              Relatório de Reservas
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Telefone
              </label>
              <input
                type="text"
                placeholder="Ex: 54999999999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && gerarRelatorio()}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="Pendente">Pendente</option>
                <option value="Confirmada">Confirmada</option>
              </select>
            </div>

            <button
              onClick={gerarRelatorio}
              disabled={carregando}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600
                         disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <Search className="w-4 h-4" />
              {carregando ? 'Gerando...' : 'Gerar relatório'}
            </button>

            {buscou && clientes.length > 0 && (
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200
                           text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>
            )}
          </div>

          {erro && <p className="text-red-500 text-sm mt-2">{erro}</p>}
        </div>

        {/* Resultado */}
        {buscou && !carregando && clientes.length === 0 && !erro && (
          <p className="text-gray-500 text-sm">
            Nenhuma reserva encontrada para os filtros informados.
          </p>
        )}

        <div className="space-y-6">
          {clientes.map((cliente, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm p-5 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid"
            >
              {/* Cabeçalho do cliente */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <h2 className="font-bold text-gray-800 text-lg">
                  {cliente.nome}
                </h2>
                <p className="text-sm text-gray-500">{cliente.telefone}</p>
              </div>

              {/* Tabela de itens */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase">
                    <th className="pb-2">Produto</th>
                    <th className="pb-2 text-center">Quantidade</th>
                    <th className="pb-2 text-right">Valor</th>
                    <th className="pb-2 text-right">Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.itens.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-2">{item.produto}</td>
                      <td className="py-2 text-center">{item.quantidade}</td>
                      <td className="py-2 text-right">
                        {formatarMoeda(item.valor)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatarMoeda(item.valorTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Subtotal do cliente */}
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-800">
                  Subtotal: {formatarMoeda(cliente.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total geral */}
        {clientes.length > 0 && (
          <div className="bg-gray-800 text-white rounded-2xl p-5 mt-6 flex justify-between items-center print:break-inside-avoid">
            <span className="font-bold">Total geral</span>
            <span className="font-bold text-xl">
              {formatarMoeda(totalGeral)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
