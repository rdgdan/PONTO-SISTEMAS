/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita source maps no browser em produção para facilitar o mapeamento
  // de erros minificados (útil para debugar o React error #310).
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
