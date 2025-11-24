'use client';

interface PontoEntry {
  id?: string;
  checkIn: Date;
  checkOut: Date;
  isHoliday: boolean;
  totalHours: number;
  lunchHours: number;
  normalHours: number;
  overtimeHours: number;
}

interface HistoryTableProps {
  history: PontoEntry[];
}

// Função para formatar as horas em HH:mm
const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function HistoryTable({ history }: HistoryTableProps) {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700/50 text-white">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Data</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Entrada</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Saída</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Almoço</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Horas Normais</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Horas Extras</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {history.length > 0 ? (
              history.map((entry) => (
                <tr key={entry.id} className={`transition-colors hover:bg-slate-700/50 ${entry.isHoliday ? 'bg-rose-500/10' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {entry.checkIn.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {entry.isHoliday && <span className="ml-2 text-xs text-rose-400">(Feriado)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatTime(entry.checkIn)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatTime(entry.checkOut)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">{entry.lunchHours.toFixed(2)}h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-cyan-400 text-center">{entry.normalHours.toFixed(2)}h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-violet-400 text-center">{entry.overtimeHours.toFixed(2)}h</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  Nenhum registro de ponto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
