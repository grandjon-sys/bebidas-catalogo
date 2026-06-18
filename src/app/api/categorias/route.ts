import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .select('*')
    .order('nome');

  if (error) {
    console.error('Erro categorias:', error);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}