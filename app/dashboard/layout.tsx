import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Ponto Sistemas',
  description: 'Gerencie seu ponto e veja seu histórico.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
