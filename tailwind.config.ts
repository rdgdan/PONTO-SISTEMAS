import type { Config } from 'tailwindcss';

// ARQUIVO RESETADO PARA A CONFIGURAÇÃO MAIS BÁSICA POSSÍVEL PARA FORÇAR A RECOMPILAÇÃO

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
