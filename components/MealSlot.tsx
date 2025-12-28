
import React from 'react';
import { Meal, MealCategory } from '../types';

interface MealSlotProps {
  category: MealCategory;
  selectedMeal?: Meal;
  onSelect: (meal: Meal) => void;
  customCatalog?: Meal[];
}

const MealSlot: React.FC<MealSlotProps> = ({ category, selectedMeal, onSelect, customCatalog }) => {
  const [isExpanding, setIsExpanding] = React.useState(false);
  const options = (customCatalog || []).filter(m => m.category === category);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xl font-bold text-[#A61919] min-w-[120px]">{category}</h3>
        <div className="h-px flex-grow bg-slate-100"></div>
      </div>

      {selectedMeal && !isExpanding ? (
        <div className="bg-[#F9F4ED] rounded-[2rem] p-4 sm:p-6 border border-[#A61919]/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 animate-fade-in hover:shadow-lg transition-all">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <img src={selectedMeal.image} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-md border-2 border-white flex-shrink-0" alt={selectedMeal.name} />
            <div className="flex-grow sm:hidden">
               <h4 className="text-lg font-bold text-slate-800 leading-tight">{selectedMeal.name}</h4>
               <div className="flex gap-2 mt-1 items-center">
                 <span className="text-[8px] bg-white px-2 py-0.5 rounded-full text-[#A61919] font-black uppercase tracking-widest border border-[#A61919]/10">
                   {selectedMeal.weight}
                 </span>
                 <span className="text-[10px] font-black text-[#A61919]">R$ {selectedMeal.price.toFixed(2)}</span>
               </div>
            </div>
          </div>

          <div className="flex-grow hidden sm:block">
            <h4 className="text-xl font-bold text-slate-800">{selectedMeal.name}</h4>
            <div className="mt-2 flex gap-3 items-center">
               <span className="text-[9px] bg-white px-3 py-1 rounded-full text-[#A61919] font-black uppercase tracking-widest border border-[#A61919]/20">{selectedMeal.weight}</span>
               <span className="text-lg font-black text-[#A61919]">R$ {selectedMeal.price.toFixed(2)}</span>
               <span className="text-[9px] bg-[#009246] px-3 py-1 rounded-full text-white font-black uppercase tracking-widest">Selecionado</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsExpanding(true)}
            className="w-full sm:w-auto text-[#A61919] font-black text-[10px] uppercase tracking-widest bg-white sm:bg-transparent hover:bg-white px-6 py-3 rounded-xl border border-[#A61919]/10 transition-all text-center"
          >
            TROCAR
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] p-6 border-2 border-dashed border-slate-100 hover:border-[#A61919]/20 transition-all">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {options.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option);
                  setIsExpanding(false);
                }}
                className={`flex flex-col text-left group transition-all rounded-2xl overflow-hidden border-2 ${selectedMeal?.id === option.id ? 'border-[#A61919] ring-4 ring-[#A61919]/5' : 'border-[#F9F4ED] hover:border-[#A61919]/20'}`}
              >
                <div className="relative h-24 sm:h-28 overflow-hidden">
                  <img src={option.image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-black text-[#A61919] uppercase tracking-widest">
                    {option.weight}
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <h5 className="font-bold text-[11px] sm:text-sm text-slate-800 line-clamp-1">{option.name}</h5>
                  <p className="text-[11px] text-[#A61919] font-black mt-1">R$ {option.price.toFixed(2)}</p>
                </div>
              </button>
            ))}
            {options.length === 0 && <p className="col-span-full text-slate-300 font-bold uppercase text-[9px] tracking-widest text-center py-6">Nenhum item disponível</p>}
          </div>
          {isExpanding && (
             <button 
                onClick={() => setIsExpanding(false)}
                className="mt-4 w-full text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-[#A61919] transition-colors"
             >
               Fechar Opções
             </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MealSlot;
