
import React, { useState } from 'react';
import { Meal, SelectionState, CartState, DAYS_OF_WEEK } from '../types';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selection?: SelectionState;
  cart?: CartState;
  type: 'kit' | 'menu';
}

const LOGO_URL = "https://api.aistudio.google.com/v1/files/file-01jkr0a3qf693jsc759n7708pt";

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, selection, cart, type }) => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const matelliPhone = "5511958877900";

  const calculateTotal = (): number => {
    if (type === 'kit' && selection) {
      return (Object.values(selection) as any[]).reduce((acc: number, dayData) => {
        return acc + (Object.values(dayData) as any[]).reduce((dayAcc: number, meal) => dayAcc + (meal?.price || 0), 0);
      }, 0);
    } else if (type === 'menu' && cart) {
      return (Object.values(cart) as any[]).reduce((acc: number, item: any) => acc + (item.meal.price * item.quantity), 0);
    }
    return 0;
  };

  const generateOrderId = () => {
    return `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const getIngredientList = () => {
    const ingredientMap: Record<string, string[]> = {};
    const addIngredients = (meal: Meal, qty: number = 1) => {
      Object.entries(meal.ingredients || {}).forEach(([name, measure]) => {
        if (!ingredientMap[name]) ingredientMap[name] = [];
        for(let i=0; i < qty; i++) ingredientMap[name].push(measure);
      });
    };

    if (type === 'kit' && selection) {
      Object.values(selection).forEach(dayData => {
        (Object.values(dayData) as any[]).forEach(meal => { if (meal) addIngredients(meal as Meal); });
      });
    } else if (type === 'menu' && cart) {
      (Object.values(cart) as any[]).forEach(item => { addIngredients(item.meal, item.quantity); });
    }
    return ingredientMap;
  };

  const handleFinishOrder = async () => {
    setIsSaving(true);
    const newId = generateOrderId();
    const total = calculateTotal();
    const ingredients = getIngredientList();

    try {
      // 1. Persistência no Firebase Firestore (Importante para que o Admin veja a lista consolidada depois)
      const orderData = {
        id: newId,
        createdAt: serverTimestamp(),
        type,
        total,
        status: 'aprovado',
        items: JSON.parse(JSON.stringify(type === 'kit' ? selection : cart)),
        shoppingList: ingredients
      };

      await setDoc(doc(db, "orders", newId), orderData);

      // 2. Mensagem Matelli
      let orderText = `*PEDIDO #${newId} - MATELLI CONGELADOS*\n\n`;
      if (type === 'kit' && selection) {
        orderText += `*🍱 KIT SEMANAL PARCIAL*\n`;
        DAYS_OF_WEEK.forEach(day => {
          const dayMeals = selection![day];
          if (dayMeals && Object.keys(dayMeals).length > 0) {
            orderText += `\n*${day.toUpperCase()}:*\n`;
            Object.values(dayMeals).forEach(m => {
              if (m) orderText += `- ${(m as Meal).name}\n`;
            });
          }
        });
      } else {
        orderText += `*📖 PEDIDO AVULSO*\n`;
        Object.values(cart!).forEach((item: any) => {
          orderText += `- ${item.meal.name} x${item.quantity}\n`;
        });
      }
      orderText += `\n*Valor Estimado: R$ ${total.toFixed(2)}*`;

      // 3. Abertura do WhatsApp do cliente para a Matelli
      window.open(`https://wa.me/${matelliPhone}?text=${encodeURIComponent(orderText)}`, '_blank');
      
      setOrderId(newId);
      setIsSent(true);
    } catch (error: any) {
      console.error("Erro ao salvar pedido:", error);
      alert("Houve um erro ao processar seu pedido. Por favor, tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative animate-fade-in flex flex-col h-[85vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#A61919]">
              {isSent ? 'Pedido Processado' : 'Revisão do Pedido'}
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              {isSent ? `Identificador Único: ${orderId}` : 'Revise seus itens antes do envio'}
            </p>
          </div>
          <img src={LOGO_URL} alt="Matelli" className="h-12 w-auto hidden sm:block" />
        </div>

        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
          {isSent ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
              <div className="w-24 h-24 bg-[#009246]/10 rounded-full flex items-center justify-center text-[#009246]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Comprovante Digital</span>
                <h3 className="text-4xl font-black text-[#A61919] tracking-tighter">{orderId}</h3>
                <p className="text-slate-500 font-medium mt-4 max-w-sm mx-auto leading-tight">
                  Seu pedido foi registrado e o WhatsApp de atendimento foi aberto para conclusão.
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="bg-slate-800 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-transform"
              >
                Concluir e Voltar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {type === 'kit' && selection ? (
                DAYS_OF_WEEK.map(day => {
                  const dayMeals = selection[day];
                  if (!dayMeals || Object.keys(dayMeals).length === 0) return null;
                  return (
                    <div key={day} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-slate-50 pb-1">{day}</h3>
                      <ul className="space-y-2">
                        {(Object.values(dayMeals) as Meal[]).map((m, i) => (
                          <li key={i} className="text-sm font-bold text-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#009246]"></span>
                              {m?.name}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              ) : (
                <ul className="space-y-3">
                  {Object.values(cart || {}).map((item: any, i) => (
                    <li key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <div>
                         <p className="font-bold text-slate-700">{item.meal.name}</p>
                         <p className="text-[10px] text-slate-400 font-medium">Quantidade: {item.quantity}</p>
                      </div>
                      <p className="font-black text-[#A61919]">R$ {(item.meal.price * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {!isSent && (
          <div className="p-6 bg-white border-t border-slate-100 rounded-b-[2.5rem]">
            <div className="flex justify-between items-end mb-4">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo Financeiro</p>
                 <span className="text-3xl font-black text-[#A61919]">R$ {calculateTotal().toFixed(2)}</span>
               </div>
               <p className="text-[9px] text-[#A61919] font-bold italic leading-tight max-w-[140px] text-right">
                 Confirmação gera um ID de pedido.
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onClose}
                disabled={isSaving}
                className="py-4 text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFinishOrder}
                disabled={isSaving}
                className="bg-[#009246] text-white py-4 rounded-2xl font-bold text-xs shadow-xl shadow-[#009246]/20 text-center flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform uppercase tracking-widest"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>✅ Confirmar Pedido</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderModal;
