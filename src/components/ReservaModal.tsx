'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, ShoppingCart, User, Phone, Package } from 'lucide-react';
import { Produto, ReservaFormData } from '@/types';

interface ReservaModalProps {
  produto: Produto;
  onClose: () => void;
  onConfirmar: (dados: ReservaFormData) => Promise<void>;
}

export function ReservaModal({ produto, onClose, onConfirmar }: ReservaModalProps) {
  const [carregando, setCarregando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ReservaFormData>({
    defaultValues: { quantidade: 1 },
  });

  const qtd = watch('quantidade');

  const onSubmit = async (dados: ReservaFormData) => {
    setCarregando(true);
    try {
      await onConfirmar(dados);
    } finally {
      setCarregando(false);
    }
  };

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/[^0-9]/g, '');
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return '(' + nums.slice(0, 2) + ') ' + nums.slice(2);
    if (nums.length <= 11) return '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7);
    return '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7, 11);
  };

  const validarTelefone = (valor: string) => {
    const nums = valor.replace(/[^0-9]/g, '');
    if (nums.length < 10) return 'Telefone incompleto';
    if (nums.length > 11) return 'Telefone inválido';
    return true;
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 text-orange-600">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-bold text-lg text-gray-800">Fazer Reserva</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Info do produto */}
        <div className="px-5 py-4 bg-orange-50 border-b border-orange-100">
          <p className="font-semibold text-gray-800">{produto.nome}</p>
          <div className="flex items-center gap-4 mt-1">
            {produto.preco && (
              <span className="text-orange-600 font-bold">
                R$ {produto.preco.toFixed(2)}
              </span>
            )}
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Package className="w-4 h-4" />
              {produto.estoque} disponíveis
            </span>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantidade
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={produto.estoque}
                className="input-field text-center w-28 text-lg font-bold"
                {...register('quantidade', {
                  required: 'Informe a quantidade',
                  min: { value: 1, message: 'Mínimo 1 unidade' },
                  max: {
                    value: produto.estoque,
                    message: 'Máximo ' + produto.estoque + ' unidades',
                  },
                  valueAsNumber: true,
                })}
              />
              {produto.preco && qtd > 0 && (
                <span className="text-gray-500 text-sm">
                  Total:{' '}
                  <strong className="text-gray-800 text-base">
                    R$ {(produto.preco * (qtd || 0)).toFixed(2)}
                  </strong>
                </span>
              )}
            </div>
            {errors.quantidade && (
              <p className="text-red-500 text-xs mt-1">
                {errors.quantidade.message}
              </p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Seu nome
            </label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              className="input-field"
              {...register('nome_comprador', {
                required: 'Informe seu nome',
                minLength: { value: 2, message: 'Nome muito curto' },
              })}
            />
            {errors.nome_comprador && (
              <p className="text-red-500 text-xs mt-1">
                {errors.nome_comprador.message}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Phone className="inline w-4 h-4 mr-1" />
              WhatsApp
            </label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              className="input-field"
              {...register('telefone', {
                required: 'Informe seu telefone',
                validate: validarTelefone,
                onChange: (e) => {
                  e.target.value = formatarTelefone(e.target.value);
                },
              })}
            />
            {errors.telefone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.telefone.message}
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={carregando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={carregando || produto.estoque === 0}
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Reservando...
                </span>
              ) : (
                'Confirmar Reserva'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}