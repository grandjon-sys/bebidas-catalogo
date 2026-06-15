import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function verificarAdmin(request: NextRequest): boolean {
  const senha = request.headers.get('x-admin-password');
  return senha === process.env.ADMIN_PASSWORD;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verificarAdmin(request)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    const statusValidos = ['pendente', 'confirmada', 'cancelada'];
    if (!statusValidos.includes(status)) {
      return NextResponse.json({ erro: 'Status inválido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('reservas')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar reserva:', error);
      return NextResponse.json({ erro: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('Erro inesperado PATCH:', err);
    return NextResponse.json({ erro: 'Erro inesperado' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verificarAdmin(request)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { data: reserva, error: erroReserva } = await supabaseAdmin
      .from('reservas')
      .select('produto_id, quantidade, status')
      .eq('id', params.id)
      .single();

    if (erroReserva || !reserva) {
      return NextResponse.json(
        { erro: 'Reserva não encontrada' },
        { status: 404 }
      );
    }

    if (reserva.status !== 'cancelada') {
      const { error: erroEstoque } = await supabaseAdmin.rpc('devolver_estoque', {
        p_produto_id: reserva.produto_id,
        p_quantidade: reserva.quantidade,
      });

      if (erroEstoque) {
        console.error('Erro ao devolver estoque:', erroEstoque);
        return NextResponse.json(
          { erro: 'Erro ao devolver estoque: ' + erroEstoque.message },
          { status: 500 }
        );
      }
    }

    const { error: erroDelete } = await supabaseAdmin
      .from('reservas')
      .delete()
      .eq('id', params.id);

    if (erroDelete) {
      console.error('Erro ao deletar reserva:', erroDelete);
      return NextResponse.json({ erro: erroDelete.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('Erro inesperado DELETE:', err);
    return NextResponse.json({ erro: 'Erro inesperado' }, { status: 500 });
  }
}