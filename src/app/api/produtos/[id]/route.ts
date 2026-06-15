import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function verificarAdmin(request: NextRequest) {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

// PUT — atualiza produto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verificarAdmin(request)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('produtos')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — desativa produto (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verificarAdmin(request)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('produtos')
    .update({ ativo: false })
    .eq('id', params.id);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}