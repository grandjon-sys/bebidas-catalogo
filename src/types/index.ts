export interface Produto {
  id: string;
  nome: string;
  imagem_url: string | null;
  estoque: number;
  preco: number | null;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface Reserva {
  id: string;
  produto_id: string;
  nome_comprador: string;
  telefone: string;
  quantidade: number;
  status: 'pendente' | 'confirmada' | 'cancelada';
  criado_em: string;
  // Join com produtos
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