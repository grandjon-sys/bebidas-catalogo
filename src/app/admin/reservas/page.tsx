'use client';

import { useEffect, useState, useCallback } from 'react';
import { Reserva } from '@/types';
import {
  ArrowLeft, Phone, User, Package,
  Clock, CheckCircle, Trash2, RotateCcw,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { Toast } from '@/components/Toast';

// ── Cores por status ──────────────────────────────────────────
const STATUS_STYLE = {
  pendente:   { badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200', label: 'Pendente' },
  confirmada: { badge: 'bg-green-100  text-green-700  border border-green-200',  label: 'Atendido' },
  cancelada:  { badge: 'bg-red-100    text-red-600    border border-red-200',    label: 'Cancelada' },
};

// ── Filtros disponíveis ───────────────────────────────────────
const FILTROS = [
  { valor: 'todos',     label: 'Todos'     },
  { valor: 'pendente',  label: 'Pendentes' },
  { valor: 'confirmada',label: 'Atendidos' },
  { valor: 'cancelada', label: 'Canceladas'},
] as const;

type FiltroTipo = 'todos' | 'pendente' | 'confirmada' | 'cancelada';

export default function ReservasPage() {
  const [reservas, setReservas]     = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]             = useState('');
  const [filtro, setFiltro]         = useState<FiltroTipo>('todos');
  const [toast, setToast]           = useState<{
    mensagem: string; tipo: 'sucesso' | 'erro'
  } | null>(null);

  const getSenha = () => sessionStorage.getItem('admin_senha') ?? '';

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-password': getSenha(),
  }), []);

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'erro') =>
    setToast({ mensagem, tipo });

  // ── Carrega reservas ────────────────────────────────────────
const carregarReservas = useCallback(async () => {
  setCarregando(true);
  try {
    const res = await fetch('/api/reservas', { headers: headers() });
    if (!res.ok) throw new Error('Não autorizado');
    const data = await res.json();
    setReservas(Array.isArray(data) ? data : []); // ✅ garante array
  } catch {
    setErro('Acesso negado. Faça login no painel admin.');
  } finally {
    setCarregando(false);
  }
}, [headers]);

useEffect(() => {
  // ✅ Se não tem senha salva, redireciona para o login
  const senha = sessionStorage.getItem('admin_senha');
  if (!senha) {
    window.location.href = '/admin';
    return;
  }
  carregarReservas();
}, [carregarReservas]);

  // ── Confirmar / marcar como atendido ───────────────────────
  const handleConfirmar = async (id: string) => {
    const res = await fetch(`/api/reservas/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: 'confirmada' }),
    });

    if (res.ok) {
      mostrarToast('Reserva marcada como atendida! ✅', 'sucesso');
      // Atualiza localmente sem recarregar tudo
      setReservas((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'confirmada' } : r)
      );
    } else {
      mostrarToast('Erro ao confirmar reserva.', 'erro');
    }
  };

  // ── Reverter para pendente ──────────────────────────────────
  const handleReverter = async (id: string) => {
    const res = await fetch(`/api/reservas/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: 'pendente' }),
    });

    if (res.ok) {
      mostrarToast('Reserva revertida para pendente.', 'sucesso');
      setReservas((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'pendente' } : r)
      );
    } else {
      mostrarToast('Erro ao reverter reserva.', 'erro');
    }
  };

  // ── Excluir reserva ────────────────────────────────────────
  const handleExcluir = async (id: string, nome: string) => {
    const confirmou = window.confirm(
      `Excluir reserva de "${nome}"?\n\nO estoque será devolvido automaticamente.`
    );
    if (!confirmou) return;

    const res = await fetch(`/api/reservas/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });

    if (res.ok) {
      mostrarToast('Reserva excluída e estoque devolvido.', 'sucesso');
      setReservas((prev) => prev.filter((r) => r.id !== id));
    } else {
      mostrarToast('Erro ao excluir reserva.', 'erro');
    }
  };

  // ── Filtragem ───────────────────────────────────────────────
  const reservasFiltradas = reservas.filter((r) =>
    filtro === 'todos' ? true : r.status === filtro
  );

  // ── Contadores por status ───────────────────────────────────
  const contadores = {
    todos:      reservas.length,
    pendente:   reservas.filter((r) => r.status === 'pendente').length,
    confirmada: reservas.filter((r) => r.status === 'confirmada').length,
    cancelada:  reservas.filter((r) => r.status === 'cancelada').length,
  };

  const formatarData = (iso: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-10 bg-gray-50">

      {/* Header */}
      <header className="bg-gray-800 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Reservas
          </h1>
          <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ml-auto">
            {contadores.pendente} pendente{contadores.pendente !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filtros */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full
                          transition-all border
                          ${filtro === f.valor
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                          }`}
            >
              {f.label}
              {' '}
              <span className="opacity-70">({contadores[f.valor]})</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-3">

        {/* Estados de carregamento / erro / vazio */}
        {carregando && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded-full w-20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
                <div className="flex gap-2 mt-3">
                  <div className="h-9 bg-gray-200 rounded-xl flex-1" />
                  <div className="h-9 bg-gray-200 rounded-xl w-10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {erro && (
          <div className="text-center py-16">
            <p className="text-red-500 font-semibold">{erro}</p>
            <Link href="/admin" className="text-orange-500 text-sm mt-2 inline-block underline">
              Ir para o login
            </Link>
          </div>
        )}

        {!carregando && !erro && reservasFiltradas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ShoppingBag className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nenhuma reserva encontrada</p>
            <p className="text-sm mt-1">
              {filtro !== 'todos' && (
                <button
                  onClick={() => setFiltro('todos')}
                  className="text-orange-500 underline"
                >
                  Ver todas
                </button>
              )}
            </p>
          </div>
        )}

        {/* Cards de reserva */}
        {!carregando && reservasFiltradas.map((reserva) => (
          <div
            key={reserva.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden
              ${reserva.status === 'confirmada' ? 'border-green-200' :
                reserva.status === 'cancelada'  ? 'border-red-200 opacity-70' :
                'border-gray-100'}`}
          >
            {/* Topo do card */}
            <div className="flex items-start justify-between p-4 pb-3">
              <div>
                <p className="font-bold text-gray-800 leading-tight">
                  {reserva.produtos?.nome}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  #{reserva.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2
                ${STATUS_STYLE[reserva.status].badge}`}>
                {STATUS_STYLE[reserva.status].label}
              </span>
            </div>

            {/* Dados do comprador */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3
                            border-t border-gray-50 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate font-medium">{reserva.nome_comprador}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a
                  href={`https://wa.me/55${reserva.telefone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline font-medium"
                >
                  {reserva.telefone}
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  <strong>{reserva.quantidade}</strong>{' '}
                  unidade{reserva.quantidade !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs">{formatarData(reserva.criado_em)}</span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-50 bg-gray-50">

              {/* Botão Confirmar — só aparece se pendente */}
              {reserva.status === 'pendente' && (
                <button
                  onClick={() => handleConfirmar(reserva.id)}
                  className="flex-1 flex items-center justify-center gap-2
                             bg-green-500 hover:bg-green-600 active:scale-95
                             text-white text-sm font-semibold
                             py-2.5 px-4 rounded-xl transition-all shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marcar Atendido
                </button>
              )}

              {/* Botão Reverter — só aparece se confirmada */}
              {reserva.status === 'confirmada' && (
                <button
                  onClick={() => handleReverter(reserva.id)}
                  className="flex-1 flex items-center justify-center gap-2
                             bg-yellow-400 hover:bg-yellow-500 active:scale-95
                             text-white text-sm font-semibold
                             py-2.5 px-4 rounded-xl transition-all shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reverter Pendente
                </button>
              )}

              {/* Botão Excluir — sempre visível */}
              <button
                onClick={() => handleExcluir(reserva.id, reserva.nome_comprador)}
                className="flex items-center justify-center gap-2
                           bg-white hover:bg-red-50 active:scale-95
                           border border-red-200 text-red-500
                           text-sm font-semibold
                           py-2.5 px-4 rounded-xl transition-all
                           min-w-[44px]"
                title="Excluir reserva"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </main>

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