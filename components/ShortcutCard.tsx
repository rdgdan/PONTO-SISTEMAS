'use client';

import { ReactNode } from 'react';

interface ShortcutCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function ShortcutCard({ icon, title, description }: ShortcutCardProps) {
  return (
    <div className="rounded-2xl bg-zinc-800/50 p-6 flex flex-col items-start justify-center border border-zinc-700/80 transition-all hover:border-zinc-500 hover:bg-zinc-800/80 shadow-md hover:shadow-zinc-800/50">
      <div className="mb-4 rounded-full bg-zinc-900 p-3 ring-1 ring-zinc-700">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}
