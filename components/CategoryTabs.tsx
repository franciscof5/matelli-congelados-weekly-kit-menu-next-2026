
import React from 'react';
import { MealCategory } from '../types';

interface CategoryTabsProps {
  activeCategory: MealCategory;
  onCategoryChange: (category: MealCategory) => void;
  progress: Record<MealCategory, number>;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, onCategoryChange, progress }) => {
  const categories = Object.values(MealCategory);
  
  return (
    <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar">
      {categories.map((cat) => {
        const isSelected = activeCategory === cat;
        const count = progress[cat];
        const isDone = count === 7;
        
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`
              flex flex-col items-center px-6 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap border min-w-[140px]
              ${isSelected 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'}
            `}
          >
            <span className="text-sm font-semibold mb-1">{cat}</span>
            <div className="flex items-center space-x-1">
              <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                {count}/7
              </span>
              <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isDone ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${(count / 7) * 100}%` }}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
