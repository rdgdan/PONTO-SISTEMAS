'use client';

import { MouseEventHandler, ReactNode } from 'react';

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  icon: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export default function ActionCard({ title, description, buttonText, icon, onClick, disabled }: ActionCardProps) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 flex flex-col items-center text-center">
      <div className="mb-4 text-blue-400">{icon}</div>
      <h3 className="text-xl font-bold text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-400 mb-6">{description}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
      >
        {buttonText}
      </button>
    </div>
  );
}
