// next.config.mjs  ← mantém o .mjs mas muda a sintaxe

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

// ⚠️ Troca module.exports por export default
export default nextConfig;