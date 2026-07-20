/**
 * Script: upload-imagens.mjs
 * -----------------------------------------
 * Sobe todas as imagens de uma pasta local para o Supabase Storage
 * e atualiza o campo `imagem_url` do produto correspondente.
 *
 * REGRA DE CASAMENTO: o NOME DO ARQUIVO (sem extensão) deve ser
 * IGUAL ao `id` do produto na tabela `produtos`.
 * Exemplo: arquivo "agua-mineral-500ml.jpg" atualiza o produto
 * com id = "agua-mineral-500ml".
 *
 * COMO USAR:
 * 1. npm install @supabase/supabase-js dotenv
 * 2. Coloque as imagens na pasta ./imagens-upload (na raiz do projeto)
 * 3. Renomeie cada arquivo para bater com o "id" do produto no banco
 * 4. Rode: node scripts/upload-imagens.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'fs';
import { join, extname, basename } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'produtos-imagens';
const PASTA_ORIGEM = './imagens-upload';

const EXTENSOES_VALIDAS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltam variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function garantirBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const existe = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!existe) {
    console.log(`📦 Bucket "${BUCKET_NAME}" não existe. Criando...`);
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    });
    if (error) {
      console.error('❌ Erro ao criar bucket:', error.message);
      process.exit(1);
    }
    console.log('✅ Bucket criado com sucesso.');
  }
}

async function processarImagens() {
  let arquivos;
  try {
    arquivos = readdirSync(PASTA_ORIGEM).filter((f) =>
      EXTENSOES_VALIDAS.includes(extname(f).toLowerCase())
    );
  } catch (err) {
    console.error(`❌ Não foi possível ler a pasta "${PASTA_ORIGEM}". Ela existe?`);
    process.exit(1);
  }

  if (arquivos.length === 0) {
    console.log(`⚠️  Nenhuma imagem encontrada em "${PASTA_ORIGEM}".`);
    return;
  }

  console.log(`🔍 ${arquivos.length} imagem(ns) encontrada(s). Iniciando upload...\n`);

  let sucesso = 0;
  let semProduto = 0;
  let falhas = 0;

  for (const arquivo of arquivos) {
    const caminhoCompleto = join(PASTA_ORIGEM, arquivo);
    const ext = extname(arquivo).toLowerCase();
    const produtoId = basename(arquivo, ext);
    const buffer = readFileSync(caminhoCompleto);

    // 1. Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(arquivo, buffer, {
        contentType: MIME_TYPES[ext],
        upsert: true, // sobrescreve se já existir
      });

    if (uploadError) {
      console.error(`❌ Falha no upload de "${arquivo}": ${uploadError.message}`);
      falhas++;
      continue;
    }

    // 2. Pega a URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(arquivo);

    const imagemUrl = publicUrlData.publicUrl;

    // 3. Atualiza o produto correspondente
    const { data: produtoAtualizado, error: updateError } = await supabase
      .from('produtos')
      .update({ imagem_url: imagemUrl })
      .eq('id', produtoId)
      .select();

    if (updateError) {
      console.error(`❌ Falha ao atualizar produto "${produtoId}": ${updateError.message}`);
      falhas++;
      continue;
    }

    if (!produtoAtualizado || produtoAtualizado.length === 0) {
      console.warn(`⚠️  Imagem "${arquivo}" enviada, mas nenhum produto com id="${produtoId}" foi encontrado.`);
      semProduto++;
      continue;
    }

    console.log(`✅ "${arquivo}" → produto "${produtoId}" atualizado.`);
    sucesso++;
  }

  console.log('\n----------------------------------------');
  console.log(`✅ Atualizados com sucesso: ${sucesso}`);
  console.log(`⚠️  Enviados sem produto correspondente: ${semProduto}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log('----------------------------------------');
}

async function main() {
  console.log('🚀 Iniciando upload de imagens para o Supabase Storage...\n');
  await garantirBucket();
  await processarImagens();
}

main();
