import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const senha = request.headers.get('x-admin-password');
  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservas')
    .select(`
      *,
      produtos ( nome )
    `)
    .order('criado_em', { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_id, nome_comprador, telefone, quantidade } = body;

    if (!produto_id || !nome_comprador || !telefone || !quantidade) {
      return NextResponse.json(
        { sucesso: false, erro: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const { data: produto, error: erroProduto } = await supabaseAdmin
      .from('produtos')
      .select('estoque, nome')
      .eq('id', produto_id)
      .single();

    if (erroProduto || !produto) {
      return NextResponse.json(
        { sucesso: false, erro: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    if (produto.estoque < quantidade) {
      return NextResponse.json(
        { sucesso: false, erro: `Estoque insuficiente. Disponível: ${produto.estoque}` },
        { status: 400 }
      );
    }

    const { data: reserva, error: erroReserva } = await supabaseAdmin
      .from('reservas')
      .insert([{
        produto_id,
        nome_comprador,
        telefone,
        quantidade,
        status: 'pendente'
      }])
      .select()
      .single();

    if (erroReserva) {
      return NextResponse.json(
        { sucesso: false, erro: erroReserva.message },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from('produtos')
      .update({ estoque: produto.estoque - quantidade })
      .eq('id', produto_id);

    return NextResponse.json({ sucesso: true, reserva_id: reserva.id });

  } catch (error: any) {
    return NextResponse.json(
      { sucesso: false, erro: error.message },
      { status: 500 }
    );
  }
}