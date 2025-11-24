'use client';

import { useState, useMemo, useEffect, Fragment, useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { toast, Toaster } from 'sonner';
import Calendar from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import * as XLSX from 'xlsx';
import '../styles/calendar.css';

import { logPonto, deletePonto } from '@/app/actions';
import { Dialog, Transition } from '@headlessui/react';
import { Clock, Edit, Trash2, X, Calendar as CalendarIcon, FileDown } from 'lucide-react';

import Header from './Header';

// --- TIPAGENS DO CLIENTE ---
type ClientPontoEntry = {
  id: string;
  userId: string;
  checkIn: string; 
  checkOut: string;
  isHoliday: boolean;
  totalHours: number;
  lunchHours: number;
  normalHours: number;
  overtimeHours: number;
  bancoDeHoras: number;
};

type Holiday = { date: string; name: string; };
type CurrentUser = { uid: string; name: string; isAdmin: boolean; };

// --- FORMATAÇÃO ---
const formatCentesimal = (value: number | null | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0.00';
    }
    return value.toFixed(2);
};

// --- TIPO PARA EXPORTAÇÃO ---
type ExportRow = {
    'Data': string;
    'Entrada': string;
    'Saída': string;
    'Almoço (h)': number;
    'Horas Normais (h)': number;
    'Horas Extras (h)': number;
    'Banco de Horas (h)': number;
};

// --- COMPONENTE PRINCIPAL ---
export default function DashboardClient({ currentUser, initialHistory, holidays }: { currentUser: CurrentUser; initialHistory: ClientPontoEntry[]; holidays: Holiday[]; }) {
  const [history, setHistory] = useState<ClientPontoEntry[]>(initialHistory);
  const [editingEntry, setEditingEntry] = useState<ClientPontoEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientTimeZone, setClientTimeZone] = useState<string | null>(null);

  useEffect(() => {
    setClientTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const formatInUserTimeZone = useCallback((dateInput: string | Date, formatString: string) => {
    if (!clientTimeZone) return "...";
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return "data inválida";
    return formatInTimeZone(date, clientTimeZone, formatString, { locale: ptBR });
  }, [clientTimeZone]);

  const holidayDates = useMemo(() => new Set(holidays.map(h => h.date)), [holidays]);
  const recordedDates = useMemo(() => new Set(history.map(p => formatInUserTimeZone(p.checkIn, 'yyyy-MM-dd'))), [history, formatInUserTimeZone]);

  const openModalForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingEntry = history.find(p => formatInUserTimeZone(p.checkIn, 'yyyy-MM-dd') === dateStr);
    setSelectedDate(date);
    setEditingEntry(existingEntry || null);
    setIsModalOpen(true);
  }

  const handleCalendarClick: CalendarProps['onChange'] = (value) => {
    if (!value || Array.isArray(value)) return;
    openModalForDate(value as Date);
  };

  const handleEditClick = (entry: ClientPontoEntry) => {
      const date = parseISO(entry.checkIn);
      if (isValid(date)) {
          openModalForDate(date);
      }
  }
  
  const handleExport = () => {
    toast.info("Gerando seu arquivo XLSX...");
    const dataToExport: ExportRow[] = history.map(ponto => ({
        'Data': formatInUserTimeZone(ponto.checkIn, 'dd/MM/yyyy'),
        'Entrada': formatInUserTimeZone(ponto.checkIn, 'HH:mm'),
        'Saída': formatInUserTimeZone(ponto.checkOut, 'HH:mm'),
        'Almoço (h)': parseFloat(formatCentesimal(ponto.lunchHours)),
        'Horas Normais (h)': parseFloat(formatCentesimal(ponto.normalHours)),
        'Horas Extras (h)': parseFloat(formatCentesimal(ponto.overtimeHours)),
        'Banco de Horas (h)': parseFloat(formatCentesimal(ponto.bancoDeHoras)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico de Pontos");

    // Auto-dimensionar colunas
    const objectMaxLength = Object.keys(dataToExport[0] || {}).map(key => {
        const keyTyped = key as keyof ExportRow;
        return {
            wch: Math.max(
                key.length,
                ...dataToExport.map(obj => obj[keyTyped]?.toString().length ?? 0)
            )
        };
    });
    worksheet["!cols"] = objectMaxLength;

    XLSX.writeFile(workbook, "historico_de_pontos.xlsx");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingEntry(null), 300);
  };

  const handleDelete = async (pontoId: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      const result = await deletePonto(pontoId);
      result.success ? toast.success(result.message) : toast.error(result.message);
      if (result.success) setHistory(prev => prev.filter(p => p.id !== pontoId));
    }
  };

  const handleFormSubmit = async (formData: FormData) => {
    if (!clientTimeZone) {
        toast.error("Fuso horário não detectado. Tente recarregar a página.");
        return;
    }
    formData.append('timeZone', clientTimeZone);
    const result = await logPonto(formData);

    if (result.success && result.newEntry) {
      toast.success(result.message);
      const newEntry = result.newEntry as ClientPontoEntry;
      setHistory(prev => {
        const newHistory = prev.filter(p => p.id !== newEntry.id);
        newHistory.unshift(newEntry);
        return newHistory.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
      });
      closeModal();
    } else {
      toast.error(result.message || "Ocorreu um erro.");
    }
  };

  const tileClassName: CalendarProps['tileClassName'] = ({ date, view }) => {
    if (view === 'month' && clientTimeZone) {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (recordedDates.has(dateStr)) return 'day-with-record';
      if (holidayDates.has(dateStr)) return 'holiday-marker';
    }
    return null;
  }
  
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
        <Toaster position="top-right" richColors />
        <Header currentUser={currentUser} />
        <main className="container mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-8"><CalendarIcon /> Bater Ponto</h2>
            <div className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800 mb-8">
                <Calendar onChange={handleCalendarClick} value={selectedDate} locale="pt-BR" tileClassName={tileClassName} />
            </div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3"><Clock /> Histórico de Ponto</h2>
              <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"><FileDown size={16}/> Exportar para XLSX</button>
            </div>
            <div className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800">
                 <HistoryTable history={history} formatFunc={formatInUserTimeZone} isReady={!!clientTimeZone} onDelete={handleDelete} onEdit={handleEditClick} />
            </div>
        </main>
        <PontoFormModal isOpen={isModalOpen} onClose={closeModal} onSubmit={handleFormSubmit} editingEntry={editingEntry} selectedDate={selectedDate as Date} holidays={Array.from(holidayDates)} formatFunc={formatInUserTimeZone} timeZone={clientTimeZone}/>
    </div>
  );
}

function HistoryTable({ history, onDelete, onEdit, formatFunc, isReady }: { history: ClientPontoEntry[], onDelete: (id: string) => void, onEdit: (entry: ClientPontoEntry) => void, formatFunc: (d: string|Date, f: string) => string, isReady: boolean }) {
    const getBankColor = (value: number) => {
        if (value < 0) return 'text-red-500';
        if (value > 0) return 'text-green-500';
        return 'text-zinc-400';
    }

    return (
      <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
              <thead>
                  <tr className="border-b border-zinc-700">
                      <th className="p-4 text-zinc-300 font-semibold">Data</th>
                      <th className="p-4 text-zinc-300 font-semibold">Entrada</th>
                      <th className="p-4 text-zinc-300 font-semibold">Saída</th>
                      <th className="p-4 text-zinc-300 font-semibold">Almoço</th>
                      <th className="p-4 text-zinc-300 font-semibold">Horas Normais</th>
                      <th className="p-4 text-zinc-300 font-semibold">Horas Extras</th>
                      <th className="p-4 text-zinc-300 font-semibold">Banco de Horas</th>
                      <th className="p-4 text-zinc-300 font-semibold text-center">Ações</th>
                  </tr>
              </thead>
              <tbody>
                  {!isReady && <tr><td colSpan={8} className="text-center p-8 text-zinc-500">Carregando horários...</td></tr>}
                  {isReady && history.length === 0 && <tr><td colSpan={8} className="text-center p-8 text-zinc-500">Nenhum registro encontrado.</td></tr>}
                  {isReady && history.map(ponto => (
                  <tr key={ponto.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 text-zinc-400">
                      <td className="p-4 text-zinc-100">{formatFunc(ponto.checkIn, 'dd/MM/yyyy')}</td>
                      <td className="p-4">{formatFunc(ponto.checkIn, 'HH:mm')}</td>
                      <td className="p-4">{formatFunc(ponto.checkOut, 'HH:mm')}</td>
                      <td className="p-4 text-orange-400">{formatCentesimal(ponto.lunchHours)}h</td>
                      <td className="p-4 text-green-400">{formatCentesimal(ponto.normalHours)}h</td>
                      <td className="p-4 text-blue-400">{formatCentesimal(ponto.overtimeHours)}h</td>
                      <td className={`p-4 font-bold ${getBankColor(ponto.bancoDeHoras)}`}>{formatCentesimal(ponto.bancoDeHoras)}h</td>
                      <td className="p-4"><div className="flex justify-center gap-2"><button onClick={() => onEdit(ponto)} className="p-2 text-zinc-400 hover:text-yellow-400"><Edit size={16}/></button><button onClick={() => onDelete(ponto.id)} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 size={16}/></button></div></td>
                  </tr>
                  ))}
              </tbody>
          </table>
      </div>
    );
}

function PontoFormModal({ isOpen, onClose, onSubmit, editingEntry, selectedDate, holidays, formatFunc, timeZone }: { isOpen: boolean, onClose: () => void, onSubmit: (fd: FormData) => void, editingEntry: ClientPontoEntry | null, selectedDate: Date, holidays: string[], formatFunc: (d: string|Date, f: string) => string, timeZone: string | null }) {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');

    useEffect(() => {
        if (isOpen && timeZone && selectedDate) {
            const entryDate = editingEntry ? parseISO(editingEntry.checkIn) : selectedDate;

            if (isValid(entryDate)) {
                setDate(format(entryDate, 'yyyy-MM-dd'));

                if (editingEntry) {
                    setStartTime(formatFunc(editingEntry.checkIn, 'HH:mm'));
                    setEndTime(formatFunc(editingEntry.checkOut, 'HH:mm'));
                } else {
                    setStartTime('09:00');
                    setEndTime('18:00');
                }
            }
        }
    }, [editingEntry, selectedDate, isOpen, timeZone, formatFunc]);

    const isHoliday = holidays.includes(date);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}> 
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-50" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all border border-zinc-800">
                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-zinc-100 flex justify-between items-center">{editingEntry ? 'Editar Registro' : 'Adicionar Novo Registro'}<button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"><X size={20}/></button></Dialog.Title>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <input type="hidden" name="isHoliday" value={String(isHoliday)} />
                            {editingEntry && <input type="hidden" name="pontoId" value={editingEntry.id} />}
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">Data</label>
                                <input type="date" id="date" name="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-zinc-100" />
                                {isHoliday && <p className='text-yellow-400 text-sm mt-1'>Esta data é um feriado.</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4"><div><label htmlFor="startTime" className="block text-sm font-medium text-zinc-300 mb-1">Entrada</label><input type="time" id="startTime" name="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-zinc-100" /></div><div><label htmlFor="endTime" className="block text-sm font-medium text-zinc-300 mb-1">Saída</label><input type="time" id="endTime" name="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-zinc-100" /></div></div>
                            <div className="pt-4 flex gap-4"><button type="button" onClick={onClose} className="flex-1 justify-center items-center gap-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Cancelar</button><button type="submit" className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">{editingEntry ? 'Atualizar' : 'Salvar'}</button></div>
                        </form>
                    </Dialog.Panel>
                </Transition.Child></div></div>
            </Dialog>
        </Transition>
    );
}
