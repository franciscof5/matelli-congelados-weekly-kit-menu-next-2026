
import React, { useState, useRef, useEffect } from 'react';
import { Meal } from '../types';

interface RouletteProps {
  catalog: Meal[];
  onSelect: (meal: Meal) => void;
}

const Roulette: React.FC<RouletteProps> = ({ catalog, onSelect }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Meal | null>(null);
  const [displayItems, setDisplayItems] = useState<Meal[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (catalog.length > 0) {
      // Seleciona 8 itens para uma roleta equilibrada (número par facilita visualização)
      const shuffled = [...catalog].sort(() => 0.5 - Math.random());
      setDisplayItems(shuffled.slice(0, 8));
    }
  }, [catalog]);

  const handleSpin = () => {
    if (isSpinning || displayItems.length < 2) return;

    setIsSpinning(true);
    setResult(null);

    // Giro de pelo menos 10 voltas completas + ângulo aleatório
    const extraDegrees = Math.floor(Math.random() * 360);
    const newRotation = rotation + (360 * 10) + extraDegrees;
    
    setRotation(newRotation);

    // O tempo do setTimeout deve ser o mesmo da transition-duration do CSS (4000ms)
    setTimeout(() => {
      setIsSpinning(false);
      
      const numSlices = displayItems.length;
      const sliceAngle = 360 / numSlices;
      
      // A rotação final normalizada entre 0 e 359
      const actualDegrees = newRotation % 360;
      
      /**
       * LÓGICA DE SINCRONIA:
       * 1. O ponteiro está fixo no topo (0 graus).
       * 2. As fatias são renderizadas a partir do topo (0 graus).
       * 3. Se a roda gira X graus no sentido horário, o item que estará no topo
       *    é aquele que originalmente estava na posição (360 - X).
       */
      const normalizedAngle = (360 - actualDegrees) % 360;
      const winningIndex = Math.floor(normalizedAngle / sliceAngle);
      
      const winMeal = displayItems[winningIndex];
      setResult(winMeal);
    }, 4000);
  };

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Carregando a sorte...</p>
      </div>
    );
  }

  const numSlices = displayItems.length;
  const sliceAngle = 360 / numSlices;
  const colors = ['#A61919', '#f59e0b', '#009246', '#f59e0b'];

  // Gerar o conic-gradient para o fundo da roleta sem espaços em branco
  const conicGradient = displayItems.map((_, i) => {
    const color = colors[i % colors.length];
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    return `${color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="flex flex-col items-center w-full px-4 mb-20">
      <div className="text-center mb-12 max-w-xl">
        <h2 className="text-5xl font-black text-[#A61919] mb-4">Gira Matelli</h2>
        <p className="text-slate-500 font-medium italic">
          O sabor que o destino reservou para você hoje!
        </p>
      </div>

      <div className="relative mb-20 group">
        {/* Indicador de Seleção (Ponteiro) - FIXO NO TOPO */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          <div className="w-12 h-14 bg-white rounded-t-full shadow-2xl flex items-start justify-center pt-2 border-x border-t border-slate-100">
             <div className="w-6 h-6 bg-[#A61919] rounded-full flex items-center justify-center animate-pulse">
                <div className="w-1 h-3 bg-white/40 rounded-full" />
             </div>
          </div>
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[25px] border-t-white -mt-1 drop-shadow-lg" />
        </div>

        {/* Moldura de Luxo */}
        <div className="relative p-6 bg-white rounded-full shadow-[0_40px_100px_rgba(166,25,25,0.15)] border-[15px] border-amber-100">
          
          {/* Corpo da Roleta */}
          <div 
            ref={wheelRef}
            className="relative w-[340px] h-[340px] sm:w-[550px] sm:h-[550px] rounded-full overflow-hidden transition-transform duration-[4000ms]"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transitionTimingFunction: 'cubic-bezier(0.1, 0, 0.1, 1)',
              background: `conic-gradient(${conicGradient})`
            }}
          >
            {displayItems.map((meal, i) => {
              const angle = sliceAngle * i;
              const color = colors[i % colors.length];
              const isDark = color === '#A61919' || color === '#009246';

              return (
                <div 
                  key={meal.id}
                  className="absolute top-0 left-0 w-full h-full origin-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  {/* Conteúdo: Centralizado dentro da fatia usando metade do sliceAngle */}
                  <div 
                    className="absolute top-0 left-0 w-full h-full flex flex-col items-center"
                    style={{ transform: `rotate(${sliceAngle / 2}deg)` }}
                  >
                    {/* Foto do Prato (Borda Externa) */}
                    <div className="mt-6 sm:mt-10 w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Número (Parte Interna) */}
                    <div className={`mt-2 sm:mt-4 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-lg sm:text-2xl border-2 shadow-inner ${isDark ? 'bg-white text-[#A61919] border-[#A61919]/20' : 'bg-[#A61919] text-white border-white'}`}>
                      {i + 1}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Linhas Divisórias Brancas */}
            {displayItems.map((_, i) => (
              <div 
                key={`line-${i}`}
                className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-white/20 origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${sliceAngle * i}deg)` }}
              />
            ))}
          </div>

          {/* Eixo Central */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-36 sm:h-36 bg-white rounded-full shadow-2xl z-30 flex items-center justify-center p-4">
            <div className="w-full h-full bg-[#A61919] rounded-full flex flex-col items-center justify-center border-4 border-amber-50 shadow-inner">
               <span className="text-white font-black text-3xl sm:text-6xl italic leading-none">M</span>
               <span className="text-white/50 text-[8px] font-bold uppercase tracking-widest mt-1">Matelli</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-14 w-full max-w-6xl">
        <button 
          onClick={handleSpin}
          disabled={isSpinning}
          className={`group relative px-24 py-9 rounded-[2.5rem] font-black text-2xl tracking-[0.4em] uppercase transition-all overflow-hidden ${isSpinning ? 'bg-slate-200 text-slate-400 cursor-not-allowed scale-95' : 'bg-[#A61919] text-white hover:scale-110 active:scale-95 shadow-[0_25px_60px_rgba(166,25,25,0.4)]'}`}
        >
          <span className="relative z-10">{isSpinning ? 'GIRANDO...' : 'TENTAR A SORTE'}</span>
          {!isSpinning && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />}
        </button>

        {/* Resultado Detalhado */}
        {result && !isSpinning && (
          <div className="w-full max-w-3xl animate-fade-in">
            <div className="bg-white rounded-[4rem] p-10 sm:p-16 border-2 border-amber-300 shadow-[0_40px_80px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-400 text-white px-12 py-4 text-xs font-black uppercase tracking-[0.3em] rounded-bl-[3rem] shadow-sm">
                SORTEADO!
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="relative">
                  <div className="absolute -inset-6 bg-amber-100 rounded-full blur-2xl opacity-40 animate-pulse" />
                  <img src={result.image} className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-[3.5rem] object-cover border-[10px] border-white shadow-2xl" alt={result.name} />
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#A61919] text-white rounded-full flex items-center justify-center font-black text-4xl border-[6px] border-white shadow-xl">
                    {displayItems.indexOf(result) + 1}
                  </div>
                </div>

                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-4xl sm:text-6xl font-bold text-slate-800 leading-[0.9] mb-6">{result.name}</h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-5">
                    <span className="text-[#A61919] font-black text-5xl">R$ {result.price.toFixed(2)}</span>
                    <span className="bg-slate-100 text-slate-500 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">{result.weight}</span>
                  </div>
                  <p className="mt-8 text-slate-400 font-medium italic text-lg leading-relaxed">
                    "{result.description}"
                  </p>
                </div>
              </div>

              <div className="mt-14 flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={() => onSelect(result)}
                  className="flex-[3] bg-[#009246] text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-[#009246]/30 hover:bg-[#007a3a] transition-all"
                >
                  Adicionar ao meu Pedido
                </button>
                <button 
                  onClick={() => setResult(null)}
                  className="flex-1 px-8 py-7 bg-slate-50 text-slate-400 rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Girar Denovo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legenda Numerada Inferior */}
        <div className="w-full bg-white/40 backdrop-blur-md rounded-[4rem] p-12 sm:p-20 border border-white shadow-sm">
          <div className="flex items-center gap-6 mb-16">
            <div className="w-4 h-12 bg-[#A61919] rounded-full" />
            <h3 className="text-4xl font-bold text-slate-800 uppercase tracking-widest">Cardápio da Sorte</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayItems.map((meal, idx) => {
              const isWinner = result === meal && !isSpinning;
              return (
                <div 
                  key={meal.id} 
                  className={`relative flex flex-col items-center p-8 rounded-[3rem] border-2 transition-all duration-500 ${isWinner ? 'bg-amber-50 border-amber-300 scale-110 shadow-2xl ring-8 ring-amber-100' : 'bg-white border-slate-50 hover:border-[#A61919]/10'}`}
                >
                  <div className={`absolute -top-5 -left-3 w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-xl z-20 ${isWinner ? 'bg-amber-400 text-white' : 'bg-slate-800 text-white'}`}>
                    {idx + 1}
                  </div>
                  
                  <div className="w-28 h-28 mb-6 rounded-[2rem] overflow-hidden shadow-lg border-4 border-white">
                    <img src={meal.image} className="w-full h-full object-cover" />
                  </div>
                  
                  <h4 className={`font-bold text-center leading-tight mb-3 min-h-[48px] text-lg ${isWinner ? 'text-amber-900' : 'text-slate-800'}`}>
                    {meal.name}
                  </h4>
                  <span className={`text-sm font-black tracking-tighter ${isWinner ? 'text-amber-600' : 'text-[#A61919]'}`}>
                    R$ {meal.price.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roulette;
