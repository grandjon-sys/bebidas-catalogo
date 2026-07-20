import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/relatorios?telefone=XXXX&status=Pendente
// Header obrigatório: x-admin-password
export async function GET(request: NextRequest) {
  const senha = request.headers.get('x-admin-password');

  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const telefone = searchParams.get('telefone')?.trim();
  const status = searchParams.get('status')?.trim();

  const query = supabaseAdmin
    .from('reservas')
    .select(
      `
      id,
      nome_comprador,
      telefone,
      quantidade,
      status,
      criado_em,
      produtos ( nome, preco )
    `
    )
    .order('nome_comprador', { ascending: true });

  // Status: comparação sem diferenciar maiúsculas/minúsculas
  // (evita problema caso o banco tenha "pendente" e o filtro peça "Pendente")
  const queryComStatus = status ? query.ilike('status', status) : query;

  const { data, error } = await queryComStatus;

  if (error) {
    console.error('Erro ao buscar reservas para relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }

  // Agrupa as reservas por cliente (nome + telefone)
  type ItemRelatorio = {
    produto: string;
    quantidade: number;
    valor: number;
    valorTotal: number;
  };

  type ClienteRelatorio = {
    nome: string;
    telefone: string;
    itens: ItemRelatorio[];
    subtotal: number;
  };

  // Filtro de telefone feito em memória, comparando só os dígitos.
  // Isso evita falha quando o número está salvo formatado no banco
  // (ex: "(54) 99999-9999") e o usuário digita só números no filtro,
  // ou vice-versa.
  const apenasDigitos = (valor: string) => valor.replace(/\D/g, '');
  const telefoneFiltroDigitos = telefone ? apenasDigitos(telefone) : '';

  const reservasFiltradas = (data ?? []).filter((reserva) => {
    if (!telefoneFiltroDigitos) return true;
    return apenasDigitos(reserva.telefone ?? '').includes(telefoneFiltroDigitos);
  });

  const clientesMap = new Map<string, ClienteRelatorio>();

  for (const reserva of reservasFiltradas) {
    // O join do Supabase pode retornar objeto ou array dependendo do relacionamento;
    // tratamos os dois casos para segurança de tipos.
    const produtoInfo = Array.isArray(reserva.produtos)
      ? reserva.produtos[0]
      : reserva.produtos;

    const nomeProduto = produtoInfo?.nome ?? 'Produto não encontrado';
    const preco = produtoInfo?.preco ?? 0;
    const quantidade = reserva.quantidade ?? 0;
    const valorTotalItem = preco * quantidade;

    const chave = `${reserva.nome_comprador}|${reserva.telefone}`;

    if (!clientesMap.has(chave)) {
      clientesMap.set(chave, {
        nome: reserva.nome_comprador,
        telefone: reserva.telefone,
        itens: [],
        subtotal: 0,
      });
    }

    const cliente = clientesMap.get(chave)!;
    cliente.itens.push({
      produto: nomeProduto,
      quantidade,
      valor: preco,
      valorTotal: valorTotalItem,
    });
    cliente.subtotal += valorTotalItem;
  }

  const clientes = Array.from(clientesMap.values());
  const totalGeral = clientes.reduce((soma, c) => soma + c.subtotal, 0);

  return NextResponse.json({ clientes, totalGeral });
}
