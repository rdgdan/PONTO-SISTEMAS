export default function Loading() {
  // Uma animação de pulso simples para o indicador de carregamento
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
        <p className="mt-4 text-lg text-zinc-300">Carregando...</p>
      </div>
    </div>
  );
}
