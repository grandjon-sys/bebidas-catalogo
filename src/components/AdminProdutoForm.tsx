'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Produto, Categoria } from '@/types';
import { Package } from 'lucide-react';

type FormData = {
  nome: string;
  descricao: string | null;
  preco: number | null;
  estoque: number;
  imagem_url: string | null;
  categoria_id: number | null;
};

interface Props {
  produtoEditando: Produto | null;
  onSalvar: (dados: FormData) => Promise<void>;
  onCancelar: () => void;
}

export function AdminProdutoForm({ produtoEditando, onSalvar, onCancelar }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [salvando, setSalvando]     = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormData>({
      defaultValues: {
        nome:         '',
        descricao:    null,
        preco:        null,
        estoque:      0,
        imagem_url:   null,
        categoria_id: null,
      },
    });

  useEffect(() => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then((data) => setCategorias(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (produtoEditando) {
      reset({
        nome:         produtoEditando.nome,
        descricao:    produtoEditando.descricao,
        preco:        produtoEditando.preco,
        estoque:      produtoEditando.estoque,
        imagem_url:   produtoEditando.imagem_url,
        categoria_id: produtoEditando.categoria_id,
      });
    } else {
      reset({
        nome: '', descricao: null, preco: null,
        estoque: 0, imagem_url: null, categoria_id: null,
      });
    }
  }, [produtoEditando, reset]);

  const onSubmit = async (dados: FormData) => {
    setSalvando(true);
    try {
      await onSalvar(dados);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"
    >
      <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
        <Package className="w-5 h-5 text-orange-500" />
        {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
      </h2>

      {/* Nome */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nome *
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Ex: Jack Daniel's 1L"
          {...register('nome', { required: 'Nome obrigatório' })}
        />
        {errors.nome && (
          <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
        )}
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Categoria
        </label>
        <select
          className="input-field"
          {...register('categoria_id', {
            setValueAs: (v) => v === '' ? null : Number(v),
          })}
        >
          <option value="">Selecione uma categoria...</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          className="input-field resize-none"
          rows={2}
          placeholder="Descrição opcional..."
          {...register('descricao')}
        />
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
            {...register('preco', {
              setValueAs: (v) => v === '' ? null : Number(v),
            })}
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
              valueAsNumber: true,
              min: { value: 0, message: 'Mínimo 0' },
            })}
          />
          {errors.estoque && (
            <p className="text-red-500 text-xs mt-1">{errors.estoque.message}</p>
          )}
        </div>
      </div>

      {/* URL da imagem */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          URL da Imagem
        </label>
        <input
          type="url"
          className="input-field"
          placeholder="https://..."
          {...register('imagem_url')}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="btn-secondary flex-1"
          disabled={salvando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={salvando}
        >
          {salvando
            ? 'Salvando...'
            : produtoEditando ? 'Atualizar' : 'Criar Produto'}
        </button>
      </div>
    </form>
  );
}