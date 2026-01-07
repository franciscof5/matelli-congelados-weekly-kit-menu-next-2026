
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Meal, MealCategory } from '../types';
import html2canvas from 'html2canvas';

interface ExportMenuProps {
  catalog: Meal[];
}

type Format = '9:16' | '1:1' | '16:9';

const LOGO_URL = "https://api.aistudio.google.com/v1/files/file-01jkr0a3qf693jsc759n7708pt";
const STORAGE_KEYS = {
  HIDDEN_IDS: 'matelli_export_hidden_ids',
  CATEGORY_ORDER: 'matelli_export_category_order'
};

const ExportMenu: React.FC<ExportMenuProps> = ({ catalog }) => {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HIDDEN_IDS);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const initialCategories = useMemo(() => Array.from(new Set(catalog.map(m => m.category))), [catalog]);
  
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORY_ORDER);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.filter((cat: string) => initialCategories.includes(cat as any));
    }
    return initialCategories;
  });

  const [activeFormat, setActiveFormat] = useState<Format>('9:16');
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HIDDEN_IDS, JSON.stringify(Array.from(hiddenIds)));
  }, [hiddenIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORY_ORDER, JSON.stringify(categoryOrder));
  }, [categoryOrder]);

  const toggleVisibility = (id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...categoryOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setCategoryOrder(newOrder);
  };

  const visibleCatalog = useMemo(() => {
    return catalog.filter(m => !hiddenIds.has(m.id));
  }, [catalog, hiddenIds]);

  const groupedVisible = useMemo(() => {
    const groups: Record<string, Meal[]> = {};
    visibleCatalog.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [visibleCatalog]);

  const sortedCategories = useMemo(() => {
    return categoryOrder.filter(cat => groupedVisible[cat] && groupedVisible[cat].length > 0);
  }, [categoryOrder, groupedVisible]);

  const canvasRef = useRef<HTMLDivElement>(null);

  const getFormatDimensions = () => {
    switch(activeFormat) {
      case '9:16': return { width: 360, height: 640 };
      case '1:1': return { width: 500, height: 500 };
      case '16:9': return { width: 640, height: 360 };
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    
    try {
      // Delay para estabilização de fontes e imagens
      await new Promise(resolve => setTimeout(resolve, 2000));
      const dims = getFormatDimensions();
      
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        scale: 4, 
        backgroundColor: '#F9F4ED',
        logging: false,
        width: dims.width,
        height: dims.height,
        windowWidth: dims.width,
        windowHeight: dims.height,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-export-container]');
          if (el instanceof HTMLElement) {
            el.style.transition = 'none';
            el.style.transform = 'none';
          }
        }
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `matelli-cardapio-${activeFormat.replace(':', 'x')}.png`;
      link.click();
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Falha ao gerar imagem.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatStyles = () => {
    const dims = getFormatDimensions();
    return {
      width: `${dims.width}px`,
      height: `${dims.height}px`
    };
  };

  // Somente o formato Banner (16:9) permite multi-colunas agora
  const isMultiCol = activeFormat === '16:9' && visibleCatalog.length > 6;
  const categoryWidth = isMultiCol ? 'w-[48%]' : 'w-full';

  const formatMealName = (name: string) => {
    // Só aplica limite se for multi-coluna (geralmente Banner 16:9 com muitos itens)
    if (isMultiCol && name.length > 20) {
      return name.substring(0, 18) + '...';
    }
    return name;
  };

  return (
    <div className="flex flex-col items-center gap-12 pb-32 max-w-6xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-4xl font-black text-[#A61919] mb-3 font-matelli tracking-tight uppercase">Estúdio Matelli</h2>
        <p className="text-slate-500 font-medium italic">Seu cardápio pronto para redes sociais.</p>
      </div>

      <div className="w-full bg-white p-6 sm:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">1. Formato</label>
            <div className="space-y-2">
              {(['9:16', '1:1', '16:9'] as Format[]).map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFormat(f)}
                  className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[10px] font-black transition-all border ${activeFormat === f ? 'bg-[#A61919] border-[#A61919] text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'}`}
                >
                  <span>{f === '9:16' ? 'STORY (9:16)' : f === '1:1' ? 'FEED (1:1)' : 'BANNER (16:9)'}</span>
                </button>
              ))}
            </div>
            <div className="bg-[#F9F4ED] p-4 rounded-2xl border border-[#A61919]/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Fotos</span>
              <button 
                onClick={() => setIncludePhotos(!includePhotos)}
                className={`w-10 h-5 rounded-full transition-all relative ${includePhotos ? 'bg-[#009246]' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${includePhotos ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">2. Pratos ({visibleCatalog.length})</label>
            <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar bg-slate-50 p-3 rounded-2xl">
              {catalog.map(meal => {
                const isHidden = hiddenIds.has(meal.id);
                return (
                  <button 
                    key={meal.id}
                    onClick={() => toggleVisibility(meal.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${isHidden ? 'bg-white/50 opacity-40 grayscale' : 'bg-white border-slate-100 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={meal.image} className="w-6 h-6 rounded object-cover" />
                      <span className="text-[9px] font-bold text-slate-700 truncate max-w-[120px]">{meal.name}</span>
                    </div>
                    {!isHidden && <div className="w-1.5 h-1.5 bg-[#009246] rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">3. Ordem</label>
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl max-h-[250px] overflow-y-auto">
              {categoryOrder.map((cat, idx) => (
                <div key={cat} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[9px] font-black text-slate-700 uppercase truncate pr-1">{cat}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0} className="p-1 rounded bg-slate-100 text-slate-300 hover:bg-[#A61919] hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.57a.75.75 0 0 1-1.08-1.04l5.25-5.25a.75.75 0 0 1 1.08 0l5.25 5.25a.75.75 0 1 1-1.08 1.04l-3.96-3.958V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => moveCategory(idx, 'down')} disabled={idx === categoryOrder.length - 1} className="p-1 rounded bg-slate-100 text-slate-300 hover:bg-[#A61919] hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-3.958a.75.75 0 1 1 1.08 1.04l-5.25 5.25a.75.75 0 0 1-1.08 0l-5.25-5.25a.75.75 0 1 1-1.08-1.04l3.96 3.958V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">4. Ações</label>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className={`w-full py-7 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${isExporting ? 'bg-slate-100 text-slate-400' : 'bg-[#A61919] text-white hover:bg-[#8C1515] shadow-[#A61919]/30'}`}
              >
                {isExporting ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <>BAIXAR AGORA</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="w-full flex flex-col items-center animate-fade-in px-4">
          <div className="flex items-center gap-4 mb-4 w-full max-w-lg">
            <div className="h-px flex-grow bg-slate-200"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">Visualização Final</span>
            <div className="h-px flex-grow bg-slate-200"></div>
          </div>

          <div className="relative p-6 sm:p-10 bg-slate-100/30 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div 
              ref={canvasRef}
              data-export-container
              style={getFormatStyles()}
              className="bg-[#F9F4ED] relative transition-none overflow-hidden flex flex-col border-[1px] border-[#A61919]/5"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#A61919]/5 rounded-bl-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#009246]/5 rounded-tr-full pointer-events-none"></div>

              {/* Cabeçalho */}
              <div className="pt-0 pb-1 flex flex-col items-center relative z-10">
                <img src={LOGO_URL} alt="Matelli" className="h-9 w-auto relative drop-shadow-sm mb-0.5" />
                <div className="w-6 h-0.5 bg-[#A61919] rounded-full mb-0.5"></div>
                <h2 className="text-[14px] font-black text-[#A61919] tracking-[0.12em] font-matelli italic leading-none uppercase">CARDÁPIO DA SEMANA</h2>
              </div>

              {/* Lista de Pratos - Altura do container de 48px para manter o visual compacto solicitado anteriormente */}
              <div className={`flex-grow px-7 pb-2 overflow-hidden flex flex-wrap gap-x-4 gap-y-0 items-start content-start`}>
                {sortedCategories.map(category => (
                  <div key={category} className={`space-y-0 ${categoryWidth}`}>
                    <div className="flex items-center gap-1.5 border-l-[3px] border-[#009246] pl-1.5 py-0 mb-1 mt-1">
                      <h4 className="text-[8.5px] font-black text-[#009246] uppercase tracking-[0.1em] whitespace-nowrap">{category}</h4>
                    </div>
                    
                    <div className="space-y-0">
                      {(groupedVisible[category] as Meal[]).map(m => (
                        <div key={m.id} className="flex items-center w-full gap-1.5 border-b border-[#A61919]/5 pb-0 last:border-0 overflow-visible">
                          {includePhotos && (
                            <div className="flex-shrink-0" style={{ width: '22px', height: '22px' }}>
                              <img 
                                src={m.image} 
                                style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px' }} 
                                className="rounded-full object-cover border border-white shadow-xs" 
                                crossOrigin="anonymous" 
                              />
                            </div>
                          )}
                          {/* Altura de 48px com line-height explícito para evitar cortes. Max-width aumentado para colunas únicas. */}
                          <div className="flex-grow flex items-center min-w-0 overflow-visible" style={{ height: '48px' }}>
                            <span 
                              className="text-[13.5px] font-bold text-slate-800 tracking-tight leading-[1.5] truncate pr-1 pb-1"
                              style={{ maxWidth: isMultiCol ? '110px' : '280px' }}
                            >
                              {formatMealName(m.name)}
                            </span>
                            <div className="flex-grow border-b border-dotted border-slate-300 h-[1px] mb-1.5 opacity-40 min-w-[5px]"></div>
                            <span className="text-[11.5px] font-black text-[#A61919] whitespace-nowrap pl-1 leading-[1.5] flex-shrink-0">
                              R$ {m.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rodapé Slim */}
              <div className="bg-[#A61919] py-1.5 px-8 flex justify-between items-center text-white relative z-10 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[5px] font-black uppercase tracking-[0.2em] text-white/40 leading-none">WhatsApp</span>
                  <span className="text-[8.5px] font-bold tracking-tight leading-none">(11) 95887-7900</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[5px] font-black uppercase tracking-[0.2em] text-white/40 leading-none">Instagram</span>
                  <span className="text-[8.5px] font-bold tracking-tight leading-none">@matellicongelados</span>
                </div>
              </div>

              <div className="absolute inset-0 pointer-events-none border-[6px] border-white/5"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
