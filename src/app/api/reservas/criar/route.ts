import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_id, nome_comprador, telefone, quantidade } = body;

    if (!produto_id || !nome_comprador || !telefone || !quantidade) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos.' },
        { status: 400 }
      );
    }

    if (quantidade < 1 || !Number.isInteger(Number(quantidade))) {
      return NextResponse.json(
        { sucesso: false, erro: 'Quantidade inválida.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('realizar_reserva', {
      p_produto_id:     produto_id,
      p_nome_comprador: nome_comprador.trim(),
      p_telefone:       telefone.trim(),
      p_quantidade:     Number(quantidade),
    });

    if (error) {
      console.error('Erro RPC realizar_reserva:', error);
      return NextResponse.json(
        { sucesso: false, erro: 'Erro interno. Tente novamente.' },
        { status: 500 }
      );
    }

    if (!data.sucesso) {
      return NextResponse.json(data, { status: 409 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (err) {
    console.error('Erro inesperado:', err);
    return NextResponse.json(
      { sucesso: false, erro: 'Erro inesperado.' },
      { status: 500 }
    );
  }
}