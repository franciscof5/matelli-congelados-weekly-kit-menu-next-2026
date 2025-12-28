
import React, { useState, useMemo } from 'react';
import { SelectionState, DAYS_OF_WEEK, MEAL_ORDER, Meal } from '../types';
import { getMealPlanInsight } from '../services/gemini';

interface SummaryPanelProps {
  selection: SelectionState;
  onFinish?: () => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ selection, onFinish }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalSelected = Object.values(selection).reduce((acc: number, dayData) => acc + Object.keys(dayData).length, 0);
  const isComplete = totalSelected === 35;

  const totalPrice = useMemo(() => {
    return Object.values(selection).reduce((acc: number, dayData) => {
      return acc + Object.values(dayData).reduce((dayAcc, meal) => dayAcc + (meal?.price || 0), 0);
    }, 0);
  }, [selection]);

  const handleGetInsight = async () => {
    setLoading(true);
    const formattedSelection: Record<string, string[]> = {};
    DAYS_OF_WEEK.forEach(day => {
      const dayData = selection[day] || {};
      formattedSelection[day] = Object.values(dayData).map((m) => (m as Meal).name);
    });
    const text = await getMealPlanInsight(formattedSelection);
    setInsight(text);
    setLoading(false);
  };

  return (
    <div className="h-fit">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800 border-b pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#A61919]">
          <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 0 1 .75-.75H13.5a.75.75 0 0 1 0 1.5H9.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
        </svg>
        Progresso do Kit
      </h2>

      <div className="space-y-3 mb-8">
        {DAYS_OF_WEEK.map((day) => {
          const count = Object.keys(selection[day] || {}).length;
          const done = count === MEAL_ORDER.length;
          return (
            <div key={day} className="flex items-center justify-between">
              <span className={`text-[11px] font-bold tracking-tight ${done ? 'text-[#009246]' : 'text-slate-400 uppercase'}`}>{day}</span>
              <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-black ${done ? 'text-[#009246]' : 'text-slate-300'}`}>{count}/5</span>
                 {done ? (
                   <div className="w-2 h-2 rounded-full bg-[#009246] shadow-lg shadow-[#009246]/30 animate-pulse" />
                 ) : (
                   <div className="w-2 h-2 rounded-full border-2 border-slate-100" />
                 )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#F9F4ED] rounded-2xl p-4 mb-6 text-center border border-[#A61919]/5">
        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Estimado</div>
        <div className="text-3xl font-black text-[#A61919] tracking-tighter">
          R$ {totalPrice.toFixed(2)}
        </div>
        <div className="text-[8px] text-slate-300 font-bold uppercase mt-1">
          {totalSelected}/35 Itens
        </div>
      </div>

      <button 
        disabled={!isComplete}
        onClick={onFinish}
        className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg ${
          isComplete 
            ? 'bg-[#A61919] text-white hover:bg-[#8C1515] shadow-[#A61919]/30' 
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
        }`}
      >
        FINALIZAR KIT
      </button>

      {isComplete && (
        <button 
          onClick={handleGetInsight}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 text-[#009246] font-bold text-xs hover:underline"
        >
          {loading ? <div className="w-3 h-3 border-2 border-[#009246] border-t-transparent rounded-full animate-spin" /> : 'Análise Nutricional Matelli'}
        </button>
      )}

      {insight && (
        <div className="mt-6 p-4 bg-[#F9F4ED] rounded-2xl border-l-4 border-[#009246] animate-fade-in">
          <p className="text-[11px] text-slate-700 leading-relaxed font-medium italic">"{insight}"</p>
        </div>
      )}
    </div>
  );
};

export default SummaryPanel;
