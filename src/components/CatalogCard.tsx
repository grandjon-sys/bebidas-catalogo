'use client';

import Image from 'next/image';
import { ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { Produto } from '@/types';

interface CatalogCardProps {
  produto: Produto;
  onReservar: (produto: Produto) => void;
}

export function CatalogCard({ produto, onReservar }: CatalogCardProps) {
  const semEstoque = produto.estoque === 0;
  const poucoEstoque = produto.estoque > 0 && produto.estoque <= 5;

  return (
    <div className={`card flex flex-col ${semEstoque ? 'opacity-75' : ''}`}>

      {/* Imagem */}
      <div className="relative w-full aspect-square bg-gray-100">
        {produto.imagem_url ? (
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Badge esgotado */}
        {semEstoque && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">
          {produto.nome}
        </h3>

        {produto.descricao && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {produto.descricao}
          </p>
        )}

        {/* Preço */}
        {produto.preco && (
          <p className="text-bg-emerald-500 font-bold text-base">
            R$ {produto.preco.toFixed(2)}
          </p>
        )}

        {/* Estoque */}
        <div
          className={`flex items-center gap-1 text-xs font-medium
            ${semEstoque
              ? 'text-red-500'
              : poucoEstoque
              ? 'text-amber-500'
              : 'text-green-600'
            }`}
        >
          {poucoEstoque && <AlertCircle className="w-3.5 h-3.5" />}
          <Package className="w-3.5 h-3.5" />
          <span>
            {semEstoque
              ? 'Sem estoque'
              : `${produto.estoque} disponíve${produto.estoque === 1 ? 'l' : 'is'}`}
          </span>
        </div>

        {/* Botão */}
        <button
          onClick={() => !semEstoque && onReservar(produto)}
          disabled={semEstoque}
          className="btn-primary w-full mt-auto flex items-center justify-center gap-2 text-sm py-2.5"
        >
          <ShoppingCart className="w-4 h-4" />
          {semEstoque ? 'Esgotado' : 'Reservar'}
        </button>
      </div>
    </div>
  );
}