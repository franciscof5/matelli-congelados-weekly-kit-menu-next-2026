
import React from 'react';
import { Meal } from '../types';

interface MealCardProps {
  meal: Meal;
  count: number;
  onAdd: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
  isMaxed: boolean;
}

const MealCard: React.FC<MealCardProps> = ({ meal, count, onAdd, onRemove, isMaxed }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-[#A61919]/5 flex flex-col h-full group">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={meal.image} 
          alt={meal.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           {meal.tags.map(tag => (
             <span key={tag} className="px-3 py-1 bg-[#009246] text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-lg">
               {tag}
             </span>
           ))}
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-black text-[#A61919] uppercase tracking-widest border border-[#A61919]/10 shadow-sm">
            {meal.weight}
          </span>
        </div>
        {count > 0 && (
          <div className="absolute inset-0 bg-[#A61919]/5 backdrop-blur-[1px]" />
        )}
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <div className="mb-3">
          <h3 className="text-2xl font-bold text-slate-800 leading-tight group-hover:text-[#A61919] transition-colors">{meal.name}</h3>
        </div>
        <p className="text-slate-500 text-sm line-clamp-2 mb-8 flex-grow leading-relaxed font-medium">
          {meal.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Preço</span>
            <span className="text-[#A61919] font-black text-2xl tracking-tighter">R$ {meal.price.toFixed(2)}</span>
          </div>

          <div className="flex items-center bg-[#F9F4ED] p-1.5 rounded-2xl border border-[#A61919]/5">
            <button 
              onClick={() => onRemove(meal)}
              disabled={count === 0}
              className={`p-2.5 rounded-xl transition-all ${count === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-white active:scale-90'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
            </button>
            <span className={`text-lg font-black w-10 text-center ${count > 0 ? 'text-[#A61919]' : 'text-slate-300'}`}>
              {count}
            </span>
            <button 
              onClick={() => onAdd(meal)}
              disabled={isMaxed}
              className={`p-2.5 rounded-xl transition-all ${isMaxed ? 'text-slate-200' : 'text-[#A61919] hover:bg-white active:scale-90'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
