'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Produto } from '@/types';

type ProdutoFormData = Omit<Produto, 'id' | 'criado_em' | 'ativo'>;

interface AdminProdutoFormProps {
  produtoEditando?: Produto | null;
  onSalvar: (dados: ProdutoFormData) => Promise<void>;
  onCancelar: () => void;
}

export function AdminProdutoForm({
  produtoEditando,
  onSalvar,
  onCancelar,
}: AdminProdutoFormProps) {
  const [carregando, setCarregando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProdutoFormData>({
    defaultValues: produtoEditando
      ? {
          nome: produtoEditando.nome,
          imagem_url: produtoEditando.imagem_url ?? '',
          estoque: produtoEditando.estoque,
          preco: produtoEditando.preco ?? undefined,
          descricao: produtoEditando.descricao ?? '',
        }
      : { estoque: 0 },
  });

  const onSubmit = async (dados: ProdutoFormData) => {
    setCarregando(true);
    await onSalvar(dados);
    setCarregando(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4"
    >
      <h3 className="font-bold text-lg text-gray-800">
        {produtoEditando ? '✏️ Editar Produto' : '➕ Novo Produto'}
      </h3>

      {/* Nome */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nome *
        </label>
        <input
          className="input-field"
          placeholder="Ex: Heineken Long Neck"
          {...register('nome', { required: 'Nome obrigatório' })}
        />
        {errors.nome && (
          <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
        )}
      </div>

      {/* Preço e Estoque */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preço (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field"
            placeholder="0,00"
            {...register('preco', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Estoque *
          </label>
          <input
            type="number"
            min="0"
            className="input-field"
            {...register('estoque', {
              required: 'Obrigatório',
              min: { value: 0, message: 'Mínimo 0' },
              valueAsNumber: true,
            })}
          />
          {errors.estoque && (
            <p className="text-red-500 text-xs mt-1">{errors.estoque.message}</p>
          )}
        </div>
      </div>

      {/* URL Imagem */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          URL da imagem
        </label>
        <input
          className="input-field"
          placeholder="https://..."
          {...register('imagem_url')}
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="Descrição do produto..."
          {...register('descricao')}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={carregando}
          className="btn-primary flex-1"
        >
          {carregando ? 'Salvando...' : produtoEditando ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}