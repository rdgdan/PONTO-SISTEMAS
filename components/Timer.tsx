'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  startTime: Date;
  variant?: 'card' | 'inline'; // Adicionando a propriedade de variante
}

const Timer = ({ startTime, variant = 'card' }: TimerProps) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date();
      const difference = now.getTime() - new Date(startTime).getTime();

      if (difference < 0) {
        setElapsedTime('00:00:00');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      setElapsedTime(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [startTime]);

  // Renderização condicional baseada na variante
  if (variant === 'inline') {
    return (
      <p className="font-mono text-lg font-bold text-purple-400 animate-pulse">
        {elapsedTime}
      </p>
    );
  }

  // Variante padrão ('card')
  return (
    <div className="mt-6 text-center">
        <p className="text-lg text-gray-400">Sessão ativa há:</p>
        <p className="text-5xl font-bold font-mono text-purple-400 tracking-wider animate-pulse">
            {elapsedTime}
        </p>
    </div>
  );
};

export default Timer;
