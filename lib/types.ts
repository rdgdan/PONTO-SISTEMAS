export type PontoEntry = {
  id: string;
  userId: string;
  checkIn: Date;
  checkOut: Date;
  isHoliday: boolean;
  totalHours: number;
  lunchHours: number;
  normalHours: number;
  overtimeHours: number;
  bancoDeHoras: number;
};
