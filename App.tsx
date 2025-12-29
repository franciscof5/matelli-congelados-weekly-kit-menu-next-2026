
import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { Meal, MealCategory, SelectionState, CartState, DAYS_OF_WEEK, MEAL_ORDER } from './types';
import { MEALS_DATA } from './constants';
import SummaryPanel from './components/SummaryPanel';
import MealSlot from './components/MealSlot';
import MealCard from './components/MealCard';
import AdminPanel from './components/AdminPanel';
import LoginForm from './components/LoginForm';
import OrderModal from './components/OrderModal';
import { subscribeToMeals } from './services/mealService';
import { logQRVisit } from './services/qrService';

type Tab = 'kit' | 'menu' | 'admin';

const LOGO_URL = "https://api.aistudio.google.com/v1/files/file-01jkr0a3qf693jsc759n7708pt";

const fullPath = window.location.pathname;

const BASE_PATH = '/matelli-congelados-weekly-kit-menu-next-2026';

const path = fullPath.startsWith(BASE_PATH)
  ? fullPath.replace(BASE_PATH, '')
  : fullPath;

const isQRCodeRoute = path.startsWith('/qrcodes/');

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <img 
      src={LOGO_URL} 
      alt="Matelli Congelados" 
      className="h-full w-auto object-contain z-10"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement?.classList.add('matelli-logo-fallback');
      }}
    />
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 matelli-logo-fallback-content">
       <div className="bg-[#A61919] px-4 py-2 rounded-full border-2 border-white shadow-lg">
         <span className="font-matelli text-white text-lg font-bold">MATELLI</span>
       </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('kit');
  const [activeDay, setActiveDay] = useState<string>(DAYS_OF_WEEK[0]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [catalog, setCatalog] = useState<Meal[]>([]);

  const [selection, setSelection] = useState<SelectionState>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: {} }), {})
  );
  const [cart, setCart] = useState<CartState>({});

  // useEffect(() => {
  //   const fullPath = window.location.pathname;

  //   const BASE_PATH = '/matelli-congelados-weekly-kit-menu-next-2026';

  //   // remove base do GH Pages ou local
  //   const path = fullPath.startsWith(BASE_PATH)
  //     ? fullPath.replace(BASE_PATH, '')
  //     : fullPath;

  //   // esperado: /qrcodes/:id/:outlink
  //   if (path.startsWith('/qrcodes/')) {
  //     const parts = path.split('/').filter(Boolean);
  //     // parts = ['qrcodes', 'EMBALAGEM-123', 'https%3A%2F%2Fwww.f5sites.com']

  //     const qrId = parts[1];
  //     const encodedOutlink = parts[2];

  //     if (!qrId) return;

  //     const outlink = encodedOutlink
  //       ? decodeURIComponent(encodedOutlink)
  //       : null;

  //     logQRVisit(qrId)
  //       .then(() => {
  //         console.log(`✅ Visita registrada: ${qrId}`);

  //         if (outlink) {
  //           console.log(`➡️ Redirecionando para: ${outlink}`);
  //           document.open();
  //           document.write(`
  //             <!DOCTYPE html>
  //             <html lang="pt-BR">
  //             <head>
  //               <meta charset="UTF-8" />
  //               <title>Redirecionando...</title>
  //               <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //               <style>
  //                 html, body {
  //                   margin: 0;
  //                   padding: 0;
  //                   width: 100%;
  //                   height: 100%;
  //                   background: #ffffff;
  //                   font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  //                 }
  //                 .container {
  //                   display: flex;
  //                   align-items: center;
  //                   justify-content: center;
  //                   height: 100%;
  //                   text-align: center;
  //                 }
  //                 h1 {
  //                   font-size: 20px;
  //                   font-weight: 700;
  //                   color: #A61919;
  //                   margin-bottom: 8px;
  //                 }
  //                 p {
  //                   font-size: 14px;
  //                   color: #555;
  //                 }
  //               </style>
  //             </head>
  //             <body>
  //               <div class="container">
  //                 <div>
  //                   <h1>Obrigado por ler o QR Code!</h1>
  //                   <p>Redirecionando…</p>
  //                 </div>
  //               </div>

  //               <script>
  //                 setTimeout(() => {
  //                   window.location.href = "${outlink}";
  //                 }, 1200);
  //               </script>
  //             </body>
  //             </html>
  //             `);
  //           document.close();
  //         } else {
  //           // fallback: volta pra home
  //           window.history.replaceState({}, '', BASE_PATH + '/');
  //         }
  //       })
  //       .catch(err => {
  //         console.error('❌ Erro ao registrar visita:', err);
  //       });
  //   }
  // }, []);
  useLayoutEffect(() => {
    if (!isQRCodeRoute) return

    const [, , qrId, rawOutlink] = path.split('/')

    if (!qrId || !rawOutlink) return

    const outlink = decodeURIComponent(rawOutlink)

    logQRVisit(qrId, outlink).finally(() => {
      document.open()
      document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Redirecionando...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: #fff;
              font-family: system-ui, sans-serif;
            }
            .container {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              text-align: center;
            }
            h1 {
              font-size: 20px;
              font-weight: 700;
              color: #A61919;
              margin-bottom: 6px;
            }
            p {
              font-size: 14px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div>
              <h1>Obrigado por ler o QR Code!</h1>
              <p>Redirecionando…</p>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = "${outlink}";
            }, 1200);
          </script>
        </body>
        </html>
      `)
      document.close()
    })
  }, [])
  
    

  // Carregar cardápio do Firebase
  useEffect(() => {
    const unsubscribe = subscribeToMeals((meals) => {
      setCatalog(meals);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectMeal = (day: string, category: MealCategory, meal: Meal) => {
    setSelection(prev => ({
      ...prev,
      [day]: { ...prev[day], [category]: meal }
    }));
  };

  const addToCart = (meal: Meal) => {
    setCart(prev => ({
      ...prev,
      [meal.id]: { meal, quantity: (prev[meal.id]?.quantity || 0) + 1 }
    }));
  };

  const removeFromCart = (meal: Meal) => {
    setCart(prev => {
      if (!prev[meal.id]) return prev;
      const newQty = prev[meal.id].quantity - 1;
      if (newQty <= 0) {
        const { [meal.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [meal.id]: { ...prev[meal.id], quantity: newQty } };
    });
  };

  const totalKitMeals = useMemo(() => {
    return Object.values(selection).reduce((acc: number, dayData) => acc + Object.keys(dayData).length, 0);
  }, [selection]);

  const totalCartItems = useMemo(() => {
    return Object.values(cart).reduce((acc: number, item: any) => acc + item.quantity, 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return Object.values(cart).reduce((acc: number, item: any) => acc + (item.meal.price * item.quantity), 0);
  }, [cart]);

  const menuCategories = [
    { name: 'Café da Manhã', categories: [MealCategory.BREAKFAST] },
    { name: 'Vitamina de Frutas', categories: [MealCategory.SMOOTHIE] },
    { name: 'Refeições', categories: [MealCategory.LUNCH, MealCategory.DINNER] },
    { name: 'Sobremesas', categories: [MealCategory.DESSERT] },
  ];

  if (isQRCodeRoute) {
    return null;
  }

  if (isLoading && catalog.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F4ED]">
        <Logo className="h-24 mb-8 animate-pulse" />
        <div className="w-12 h-12 border-4 border-[#A61919] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#A61919] font-bold uppercase text-[10px] tracking-widest">Carregando Cardápio Gourmet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F4ED]">
      <header className="bg-white border-b border-[#A61919]/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('kit'); window.scrollTo(0,0); }}>
            <Logo className="h-14 sm:h-16" />
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-[#A61919] leading-tight">Congelados</h1>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Tradição & Saúde</p>
            </div>
          </div>
          
          <div className="flex bg-[#F9F4ED] p-1 rounded-2xl border border-[#A61919]/5">
            <button onClick={() => setActiveTab('kit')} className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'kit' ? 'bg-[#A61919] text-white shadow-md' : 'text-slate-500 hover:text-[#A61919]'}`}>🍱 KIT</button>
            <button onClick={() => setActiveTab('menu')} className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'menu' ? 'bg-[#A61919] text-white shadow-md' : 'text-slate-500 hover:text-[#A61919]'}`}>📖 MENU</button>
          </div>

          <button onClick={() => setIsCartOpen(!isCartOpen)} className={`relative p-3 rounded-xl transition-all ${isCartOpen ? 'bg-[#A61919] text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:text-[#A61919]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386l2.308 10.774a2.25 2.25 0 0 0 2.247 1.769h10.883a2.25 2.25 0 0 0 2.247-1.769l1.623-7.57a.75.75 0 0 0-.696-.897H5.34l-.441-2.057a.75.75 0 0 0-.736-.594H2.25Zm4.983 14.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5Zm7 0a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5Z" />
              <path d="M10 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
            </svg>
            {(totalCartItems > 0 || totalKitMeals > 0) && (
              <span className="absolute -top-1 -right-1 bg-[#009246] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {activeTab === 'kit' ? totalKitMeals : totalCartItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-full max-sm:w-full max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-out p-6 overflow-y-auto no-scrollbar ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#A61919]">Resumo do Pedido</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
          </div>
          
          {activeTab === 'kit' ? (
            <SummaryPanel selection={selection} onFinish={() => setIsOrderModalOpen(true)} />
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Carrinho Avulso</h3>
              {totalCartItems === 0 ? (
                <p className="text-slate-400 text-center py-10">Carrinho vazio.</p>
              ) : (
                <div className="space-y-3">
                  {Object.values(cart).map((item: any) => (
                    <div key={item.meal.id} className="flex items-center justify-between bg-[#F9F4ED] p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <img src={item.meal.image} className="w-10 h-10 object-cover rounded-lg" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{item.meal.name}</p>
                          <p className="text-[10px] font-black text-[#A61919]">x{item.quantity} - R$ {(item.meal.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.meal)} className="text-red-400 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4H5a2 2 0 0 0-2 2v.041c0 .248.01.493.029.736L4.17 16.924a3 3 0 0 0 2.992 2.73h5.676a3 3 0 0 0 2.992-2.73l1.142-10.147c.018-.243.029-.488.029-.736V6a2 2 0 0 0-2-2h-1v-.25A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75a1.25 1.25 0 0 1 1.25-1.25h2.5a1.25 1.25 0 0 1 1.25 1.25V4h-5v-.25Z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  ))}
                  <div className="pt-4 border-t flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase">Total do Pedido</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">(Sujeito a confirmação)</p>
                    </div>
                    <span className="text-2xl font-black text-[#A61919]">R$ {totalCartPrice.toFixed(2)}</span>
                  </div>
                  <button onClick={() => { setIsOrderModalOpen(true); setIsCartOpen(false); }} className="w-full bg-[#A61919] text-white py-4 rounded-2xl font-bold shadow-xl">FINALIZAR PEDIDO</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} selection={selection} cart={cart} type={activeTab as 'kit' | 'menu'} />

      <main className="max-w-7xl mx-auto px-4 mt-6 flex-grow w-full">
        {activeTab === 'kit' && (
          <div className="animate-fade-in">
            <div className="mb-6 text-center md:text-left">
              <h2 className="text-4xl font-bold text-[#A61919] mb-1">Monte Seu Kit</h2>
              <p className="text-slate-500 text-sm font-medium">Qualidade Matelli em 35 pratos gourmet.</p>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar sticky top-20 z-40 py-4 bg-[#F9F4ED]/95 backdrop-blur-md border-b border-[#A61919]/5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = activeDay === day;
                const dayCount = Object.keys(selection[day] || {}).length;
                return (
                  <button key={day} onClick={() => setActiveDay(day)} className={`flex flex-col items-center px-6 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap border-2 min-w-[120px] ${isSelected ? 'bg-[#A61919] border-[#A61919] text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-[#A61919]/30'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5">{day}</span>
                    <span className={`text-base font-black ${isSelected ? 'text-white/80' : 'text-[#A61919]'}`}>{dayCount}/5</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start mt-6 mb-12">
              <div className="flex-grow w-full space-y-6">
                <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-sm border border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-[#009246] rounded-full"></span>
                    Refeições de {activeDay}
                  </h2>
                  {MEAL_ORDER.map((category) => (
                    <MealSlot key={`${activeDay}-${category}`} category={category} selectedMeal={selection[activeDay]?.[category]} onSelect={(meal) => handleSelectMeal(activeDay, category, meal)} customCatalog={catalog} />
                  ))}
                </div>
              </div>
              <div className="hidden lg:block w-full lg:w-80 lg:sticky lg:top-48">
                <SummaryPanel selection={selection} onFinish={() => setIsOrderModalOpen(true)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="animate-fade-in mb-12">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-4xl font-bold text-[#A61919] mb-2">Cardápio Avulso</h2>
              <p className="text-slate-500 font-medium">Sabor italiano pronto para você.</p>
            </div>
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-grow w-full space-y-16">
                {menuCategories.map((group) => {
                  const items = catalog.filter(m => group.categories.includes(m.category));
                  if (items.length === 0) return null;
                  return (
                    <section key={group.name}>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-8 w-1.5 bg-[#009246] rounded-full"></div>
                        <h3 className="text-3xl font-bold text-slate-800">{group.name}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {items.map(meal => (
                          <MealCard key={meal.id} meal={meal} count={cart[meal.id]?.quantity || 0} onAdd={addToCart} onRemove={removeFromCart} isMaxed={false} />
                        ))}
                      </div>
                    </section>
                  );
                })}
                {catalog.length === 0 && !isLoading && (
                  <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">O Cardápio está vazio. Acesse o Admin para cadastrar pratos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-10">
            {!isAdminLoggedIn ? (
              <LoginForm onLogin={() => setIsAdminLoggedIn(true)} />
            ) : (
              <AdminPanel 
                meals={catalog} 
                onLogout={() => { setIsAdminLoggedIn(false); setActiveTab('kit'); }} 
              />
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 border-t border-[#A61919]/5 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 grayscale opacity-30 hover:opacity-100 transition-opacity">
             <Logo className="h-10" />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2024 Matelli Congelados</p>
          </div>
          <button onClick={() => { setActiveTab('admin'); window.scrollTo(0, 0); }} className={`p-3 rounded-full transition-all border border-slate-100 ${activeTab === 'admin' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-300 hover:text-slate-600'}`} title="Administração">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
