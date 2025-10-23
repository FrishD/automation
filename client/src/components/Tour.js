import React from 'react';
import { useTour } from '@reactour/tour';

const Tour = () => {
  const { setIsOpen } = useTour();
  return (
    <button onClick={() => setIsOpen(true)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
      <span className="material-symbols-outlined text-lg">help</span>
    </button>
  );
};

export default Tour;
