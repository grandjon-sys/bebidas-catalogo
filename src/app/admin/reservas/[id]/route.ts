import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function verificarAdmin(request: NextRequest) {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

// PATCH — atualiza status da reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verificarAdmin(request)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

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
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — remove reserva e devolve estoque
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verificarAdmin(request)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  // Busca a reserva antes de deletar para saber a quantidade
  const { data: reserva, error: erroReserva } = await supabaseAdmin
    .from('reservas')
    .select('produto_id, quantidade, status')
    .eq('id', params.id)
    .single();

  if (erroReserva || !reserva) {
    return NextResponse.json({ erro: 'Reserva não encontrada' }, { status: 404 });
  }

  // Só devolve estoque se a reserva não estava cancelada
  if (reserva.status !== 'cancelada') {
    await supabaseAdmin.rpc('devolver_estoque', {
      p_produto_id: reserva.produto_id,
      p_quantidade: reserva.quantidade,
    });
  }

  // Deleta a reserva
  const { error: erroDelete } = await supabaseAdmin
    .from('reservas')
    .delete()
    .eq('id', params.id);

  if (erroDelete) {
    return NextResponse.json({ erro: erroDelete.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}