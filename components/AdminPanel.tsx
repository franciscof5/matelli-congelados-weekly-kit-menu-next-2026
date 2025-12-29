
import React, { useState, useEffect, useMemo } from 'react';
import { Meal, MealCategory } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { saveMealToFirebase, deleteMealFromFirebase, syncInitialMenu } from '../services/mealService';
import { MEALS_DATA } from '../constants';
import { subscribeToQRCodes, createQRCodeTracker, QRCodeData } from '../services/qrService';

interface AdminPanelProps {
  meals: Meal[];
  onLogout: () => void;
}

type ViewType = 'meals' | 'orders' | 'shopping' | 'qrcodes';

interface EditableIngredient {
  name: string;
  measure: string;
}

const STATUS_COLORS: Record<string, string> = {
  aprovado: 'bg-emerald-100 text-emerald-700',
  compras: 'bg-amber-100 text-amber-700',
  produzindo: 'bg-blue-100 text-blue-700',
  entregues: 'bg-slate-100 text-slate-700',
};

const AdminPanel: React.FC<AdminPanelProps> = ({ meals, onLogout }) => {
  const [editingMeal, setEditingMeal] = useState<Partial<Meal> | null>(null);
  const [editIngredients, setEditIngredients] = useState<EditableIngredient[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [qrcodes, setQrcodes] = useState<QRCodeData[]>([]);
  const [view, setView] = useState<ViewType>('meals');
  const [loadingData, setLoadingData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingQR, setIsCreatingQR] = useState(false);
  const [newQR, setNewQR] = useState({ id: '', name: '' });

  useEffect(() => {
    setLoadingData(true);
    
    // Subscrição Pedidos
    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        firebaseId: doc.id,
        date: doc.data().createdAt?.toDate() || new Date()
      })));
    });

    // Subscrição QRCodes
    const unsubQRs = subscribeToQRCodes(setQrcodes);

    setLoadingData(false);
    return () => {
      unsubOrders();
      unsubQRs();
    };
  }, []);

  const handleEdit = (meal: Meal) => {
    setEditingMeal({ ...meal });
    setEditIngredients(Object.entries(meal.ingredients || {}).map(([name, measure]) => ({ name, measure })));
  };
  
  const handleCreate = () => {
    setEditingMeal({ id: 'm' + Date.now(), name: '', description: '', category: MealCategory.LUNCH, image: '', tags: [], price: 0, weight: '' });
    setEditIngredients([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMeal) {
      const ingredients: Record<string, string> = {};
      editIngredients.forEach(ing => { if (ing.name.trim()) ingredients[ing.name.trim()] = ing.measure; });
      await saveMealToFirebase({ ...editingMeal, ingredients } as Meal);
      setEditingMeal(null);
    }
  };

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQR.id && newQR.name) {
      await createQRCodeTracker(newQR.id, newQR.name);
      setNewQR({ id: '', name: '' });
      setIsCreatingQR(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (window.confirm('Excluir prato?')) await deleteMealFromFirebase(id);
  };

  const shoppingData = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'aprovado' || o.status === 'compras');
    const consolidated: Record<string, { measures: string[], orderIds: string[] }> = {};
    activeOrders.forEach(order => {
      Object.entries(order.shoppingList || {}).forEach(([ing, measures]: [string, any]) => {
        if (!consolidated[ing]) consolidated[ing] = { measures: [], orderIds: [] };
        consolidated[ing].measures.push(...measures);
        if (!consolidated[ing].orderIds.includes(order.id)) consolidated[ing].orderIds.push(order.id);
      });
    });
    return consolidated;
  }, [orders]);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[#A61919]">Painel Matelli</h2>
          <div className="flex flex-wrap gap-4 mt-4">
            <button onClick={() => setView('meals')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${view === 'meals' ? 'bg-[#A61919] text-white' : 'bg-slate-100 text-slate-400'}`}>Cardápio</button>
            <button onClick={() => setView('orders')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${view === 'orders' ? 'bg-[#A61919] text-white' : 'bg-slate-100 text-slate-400'}`}>Pedidos</button>
            <button onClick={() => setView('shopping')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${view === 'shopping' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Compras</button>
            <button onClick={() => setView('qrcodes')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${view === 'qrcodes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>QR Codes</button>
          </div>
        </div>
        <div className="flex gap-4">
          {view === 'meals' && <button onClick={handleCreate} className="bg-[#009246] text-white px-8 py-3 rounded-2xl font-bold text-[10px] tracking-widest uppercase">+ NOVO PRATO</button>}
          {view === 'qrcodes' && <button onClick={() => setIsCreatingQR(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-[10px] tracking-widest uppercase">+ NOVO RASTREADOR</button>}
          <button onClick={onLogout} className="text-slate-400 hover:text-[#A61919] font-black text-[10px] uppercase tracking-widest px-4">SAIR</button>
        </div>
      </div>

      {view === 'qrcodes' && (
        <div className="animate-fade-in">
          {isCreatingQR && (
            <div className="mb-8 bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-4">Novo Rastreador de QR Code</h3>
              <form onSubmit={handleCreateQR} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="ID (ex: mesa-01)" required value={newQR.id} onChange={e => setNewQR({...newQR, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="bg-white px-6 py-3 rounded-xl border-none outline-indigo-600 font-bold" />
                <input placeholder="Nome (ex: Mesa da Janela)" required value={newQR.name} onChange={e => setNewQR({...newQR, name: e.target.value})} className="bg-white px-6 py-3 rounded-xl border-none outline-indigo-600 font-bold" />
                <div className="flex gap-2">
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex-grow uppercase text-[10px] tracking-widest">CRIAR</button>
                  <button type="button" onClick={() => setIsCreatingQR(false)} className="bg-white text-slate-400 px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">X</button>
                </div>
              </form>
              <p className="mt-2 text-[10px] text-indigo-400 font-medium italic">A rota será: matelli.com/qrcodes/{newQR.id || 'id'}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrcodes.map(qr => (
              <div key={qr.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Rastreador ATIVO</span>
                    <h4 className="text-xl font-bold text-slate-800">{qr.name}</h4>
                    <p className="text-[10px] font-mono text-slate-400">/qrcodes/{qr.id}</p>
                  </div>
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-9ZM9 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 6.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14.25 9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" /><path d="M18.75 6.75a.75.75 0 0 0-1.5 0V15a.75.75 0 0 0 1.5 0V6.75ZM18.75 17.25a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5ZM21 15a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 21 15ZM21 18.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM21 11.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z" /></svg>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex justify-between items-center border border-slate-100">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total de Acessos</span>
                   <span className="text-3xl font-black text-indigo-600">{qr.totalAccesses}</span>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b pb-1">Últimos Acessos</p>
                   {qr.visits?.slice(-3).reverse().map((v, i) => (
                     <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                        <span className="truncate max-w-[120px] text-slate-300">{v.userAgent.split(') ')[1] || 'Mobile Device'}</span>
                     </div>
                   ))}
                   {(!qr.visits || qr.visits.length === 0) && <p className="text-[10px] text-slate-300 italic">Nenhum acesso ainda.</p>}
                </div>
                
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/qrcodes/${qr.id}`;
                    navigator.clipboard.writeText(url);
                    alert('Link copiado: ' + url);
                  }}
                  className="mt-6 w-full py-2 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  Copiar Link do QR
                </button>
              </div>
            ))}
            {qrcodes.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Crie o seu primeiro rastreador de QR Code para monitorar acessos físicos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'meals' && (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-[#F9F4ED]">
                <th className="pb-6 font-black text-slate-300 text-[10px] uppercase tracking-[0.2em]">Item</th>
                <th className="pb-6 font-black text-slate-300 text-[10px] uppercase tracking-[0.2em]">Categoria</th>
                <th className="pb-6 font-black text-slate-300 text-[10px] uppercase tracking-[0.2em]">Preço / Peso</th>
                <th className="pb-6 font-black text-slate-300 text-[10px] uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9F4ED]">
              {meals.map(meal => (
                <tr key={meal.id} className="group hover:bg-[#F9F4ED]/50 transition-colors">
                  <td className="py-6">
                    <div className="flex items-center gap-4">
                      <img src={meal.image} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                      <span className="font-bold text-slate-800 text-lg">{meal.name}</span>
                    </div>
                  </td>
                  <td className="py-6 font-bold text-slate-500 text-sm uppercase">{meal.category}</td>
                  <td className="py-6 text-sm font-black text-[#A61919]">R$ {meal.price.toFixed(2)} / {meal.weight}</td>
                  <td className="py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(meal)} className="bg-white p-3 rounded-xl shadow-sm text-[#009246] hover:bg-[#009246] hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /></svg>
                      </button>
                      <button onClick={() => handleDeleteMeal(meal.id)} className="bg-white p-3 rounded-xl shadow-sm text-[#A61919] hover:bg-[#A61919] hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4H5a2 2 0 0 0-2 2v.041c0 .248.01.493.029.736L4.17 16.924a3 3 0 0 0 2.992 2.73h5.676a3 3 0 0 0 2.992-2.73l1.142-10.147c.018-.243.029-.488.029-.736V6a2 2 0 0 0-2-2h-1v-.25A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75a1.25 1.25 0 0 1 1.25-1.25h2.5a1.25 1.25 0 0 1 1.25 1.25V4h-5v-.25Z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'orders' && (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.firebaseId} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group transition-all hover:bg-white hover:shadow-lg">
              <div className="flex-grow">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">{order.id}</span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${STATUS_COLORS[order.status || 'aprovado']}`}>
                    {order.status || 'aprovado'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{order.date.toLocaleString()}</span>
                </div>
                <h4 className="text-xl font-bold text-slate-800 mt-2">Pedido {order.type === 'kit' ? 'de Kit Semanal' : 'Avulso'}</h4>
              </div>
              <span className="text-2xl font-black text-[#A61919]">R$ {order.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {view === 'shopping' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {Object.entries(shoppingData).map(([name, data]: [string, any]) => (
            <div key={name} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <h4 className="font-bold text-slate-800 text-lg mb-2">{name}</h4>
              <div className="space-y-1">
                {data.measures.map((m: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    {m}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingMeal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl animate-fade-in max-h-[95vh] overflow-y-auto">
            <h3 className="text-3xl font-bold mb-8 text-[#A61919]">{editingMeal.name ? 'Editar Prato' : 'Novo Prato'}</h3>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <input required placeholder="Nome" value={editingMeal.name || ''} onChange={e => setEditingMeal({...editingMeal, name: e.target.value})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 outline-none font-bold" />
                  <textarea required placeholder="Descrição" value={editingMeal.description || ''} onChange={e => setEditingMeal({...editingMeal, description: e.target.value})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 outline-none h-32 font-medium" />
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <select value={editingMeal.category} onChange={e => setEditingMeal({...editingMeal, category: e.target.value as MealCategory})} className="bg-[#F9F4ED] rounded-2xl px-6 py-4 font-bold">
                      {Object.values(MealCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="number" step="0.01" value={editingMeal.price || 0} onChange={e => setEditingMeal({...editingMeal, price: parseFloat(e.target.value)})} className="bg-[#F9F4ED] rounded-2xl px-6 py-4 font-bold" />
                  </div>
                  <input placeholder="Peso (ex: 400g)" value={editingMeal.weight || ''} onChange={e => setEditingMeal({...editingMeal, weight: e.target.value})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 font-bold" />
                  <input placeholder="Imagem URL" value={editingMeal.image || ''} onChange={e => setEditingMeal({...editingMeal, image: e.target.value})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 font-mono text-xs" />
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Ingredientes</label>
                  <button type="button" onClick={() => setEditIngredients([...editIngredients, { name: '', measure: '' }])} className="text-emerald-600 font-bold text-[10px] uppercase">+ Adicionar</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {editIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 bg-white p-3 rounded-2xl border border-slate-100">
                      <input placeholder="Nome" value={ing.name} onChange={e => {
                        const newIngs = [...editIngredients];
                        newIngs[idx].name = e.target.value;
                        setEditIngredients(newIngs);
                      }} className="flex-[2] bg-transparent outline-none text-xs font-bold" />
                      <input placeholder="Qtd" value={ing.measure} onChange={e => {
                        const newIngs = [...editIngredients];
                        newIngs[idx].measure = e.target.value;
                        setEditIngredients(newIngs);
                      }} className="flex-1 bg-transparent outline-none text-xs text-slate-500" />
                      <button type="button" onClick={() => setEditIngredients(editIngredients.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500">X</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-grow bg-[#A61919] text-white py-5 rounded-2xl font-bold">SALVAR NO BANCO</button>
                <button type="button" onClick={() => setEditingMeal(null)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
