export interface Categoria {
  id: number;
  nome: string;
}

export interface Produto {
  id: string;
  nome: string;
  imagem_url: string | null;
  estoque: number;
  preco: number | null;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
  categoria_id: number | null;
  categorias?: { nome: string } | null;
}

export interface Reserva {
  id: string;
  produto_id: string;
  nome_comprador: string;
  telefone: string;
  quantidade: number;
  status: 'pendente' | 'confirmada' | 'cancelada';
  criado_em: string;
  produtos?: { nome: string };
}

export interface ReservaFormData {
  nome_comprador: string;
  telefone: string;
  quantidade: number;
}

export interface ResultadoReserva {
  sucesso: boolean;
  erro?: string;
  reserva_id?: string;
}