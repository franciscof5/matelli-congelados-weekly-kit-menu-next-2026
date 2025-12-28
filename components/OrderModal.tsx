
import React from 'react';
import { Meal, SelectionState, CartState, DAYS_OF_WEEK } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selection?: SelectionState;
  cart?: CartState;
  type: 'kit' | 'menu';
}

const LOGO_URL = "https://api.aistudio.google.com/v1/files/file-01jkr0a3qf693jsc759n7708pt";

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, selection, cart, type }) => {
  if (!isOpen) return null;

  const phoneNumber = "5511958877900";

  // Fix: Explicitly type accumulators as number to resolve 'unknown' operator '+' error
  const calculateTotal = (): number => {
    if (type === 'kit' && selection) {
      return Object.values(selection).reduce((acc: number, dayData) => {
        return acc + Object.values(dayData).reduce((dayAcc: number, meal) => dayAcc + (meal?.price || 0), 0);
      }, 0);
    } else if (type === 'menu' && cart) {
      return Object.values(cart).reduce((acc: number, item: any) => acc + (item.meal.price * item.quantity), 0);
    }
    return 0;
  };

  const generateWhatsAppMessage = () => {
    let text = `*Olá Matelli Congelados! Gostaria de finalizar meu pedido:* \n\n`;
    const total = calculateTotal();

    if (type === 'kit' && selection) {
      text += `*🍱 MEU KIT SEMANAL (35 Marmitas):*\n`;
      DAYS_OF_WEEK.forEach(day => {
        const meals = selection[day];
        if (meals) {
          text += `\n*${day.toUpperCase()}:*\n`;
          // Fix: Explicitly cast to Meal array to fix unknown property errors
          (Object.values(meals) as Meal[]).forEach(m => {
            if (m) text += `- ${m.name} (R$ ${m.price.toFixed(2)})\n`;
          });
        }
      });
    } else if (type === 'menu' && cart) {
      text += `*📖 MEU PEDIDO AVULSO:*\n`;
      // Fix: Explicitly type item as any to fix unknown property errors
      Object.values(cart).forEach((item: any) => {
        text += `- ${item.meal.name} x${item.quantity} (R$ ${(item.meal.price * item.quantity).toFixed(2)})\n`;
      });
    }

    // Fix: total is confirmed to be number now
    text += `\n*Valor Total Estimado: R$ ${total.toFixed(2)}*\n`;
    text += `\n*(Os preços serão confirmados na hora de fechar o pedido com a equipe de atendimento)*\n`;
    text += `\n*Aguardo confirmação para pagamento e agendamento!*`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative animate-fade-in flex flex-col h-[85vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#A61919]">Revisão do Pedido</h2>
            <p className="text-slate-500 text-xs font-medium">Confira seus itens e o valor total estimado</p>
          </div>
          <img src={LOGO_URL} alt="Matelli" className="h-12 w-auto hidden sm:block" />
        </div>

        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
          <div className="space-y-6">
            {type === 'kit' && selection ? (
              DAYS_OF_WEEK.map(day => (
                <div key={day} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-slate-50 pb-1">{day}</h3>
                  <ul className="space-y-2">
                    {/* Fix: Explicitly cast to Meal array to fix unknown property errors */}
                    {(Object.values(selection[day] || {}) as Meal[]).map((m, i) => (
                      <li key={i} className="text-sm font-bold text-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009246]"></span>
                          {m?.name}
                        </div>
                        <span className="text-slate-400 font-medium text-xs">R$ {m?.price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <ul className="space-y-3">
                {/* Fix: Explicitly type item as any to fix unknown property errors */}
                {Object.values(cart || {}).map((item: any, i) => (
                  <li key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                       <p className="font-bold text-slate-700">{item.meal.name}</p>
                       <p className="text-[10px] text-slate-400 font-medium">Unitário: R$ {item.meal.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-[#A61919]">x{item.quantity}</p>
                       <p className="text-xs font-bold text-slate-600">R$ {(item.meal.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 rounded-b-[2.5rem]">
          <div className="flex justify-between items-end mb-4">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total do Pedido</p>
               <p className="text-[9px] text-[#A61919] font-bold italic mt-0.5 leading-tight max-w-[200px]">
                 Preços serão confirmados na hora de fechar o pedido com a nossa equipe de atendimento.
               </p>
             </div>
             <div className="text-right">
                {/* Fix: calculateTotal returns a number confirms toFixed works */}
                <span className="text-3xl font-black text-[#A61919]">R$ {calculateTotal().toFixed(2)}</span>
             </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 text-slate-500 bg-slate-100 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
            >
              Modificar
            </button>
            <a 
              href={generateWhatsAppMessage()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-[2] bg-[#009246] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-[#009246]/20 text-center flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WHATSAPP
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
