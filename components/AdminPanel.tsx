
import React, { useState, useEffect } from 'react';
import { Meal, MealCategory } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { saveMealToFirebase, deleteMealFromFirebase, syncInitialMenu } from '../services/mealService';
import { MEALS_DATA } from '../constants';

interface AdminPanelProps {
  meals: Meal[];
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ meals, onLogout }) => {
  const [editingMeal, setEditingMeal] = useState<Partial<Meal> | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [view, setView] = useState<'meals' | 'orders'>('meals');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (view === 'orders') {
      setLoadingOrders(true);
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          firebaseId: doc.id,
          date: doc.data().createdAt?.toDate() || new Date()
        }));
        setOrders(ordersData);
        setLoadingOrders(false);
      }, (err) => {
        console.error("Erro ao carregar pedidos:", err);
        setLoadingOrders(false);
      });
      return () => unsubscribe();
    }
  }, [view]);

  const handleEdit = (meal: Meal) => setEditingMeal(meal);
  
  const handleCreate = () => setEditingMeal({ 
    id: 'm' + Date.now(), 
    name: '', 
    description: '', 
    category: MealCategory.LUNCH, 
    image: '', 
    tags: [], 
    price: 0, 
    weight: '',
    ingredients: {}
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMeal) {
      try {
        await saveMealToFirebase(editingMeal as Meal);
        setEditingMeal(null);
      } catch (err: any) {
        alert(`Erro ao salvar prato: ${err.message}`);
      }
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (window.confirm('Excluir este prato permanentemente do cardápio?')) {
      try {
        await deleteMealFromFirebase(mealId);
      } catch (e) {
        alert("Erro ao excluir prato.");
      }
    }
  };

  const handleSyncInitial = async () => {
    console.log("[Admin] Botão Sincronizar clicado.");
    if (window.confirm('Deseja popular o banco de dados com os pratos iniciais?')) {
      setIsSyncing(true);
      try {
        console.log("[Admin] Chamando syncInitialMenu com dados de constants.ts...");
        await syncInitialMenu(MEALS_DATA);
        console.log("[Admin] syncInitialMenu terminou a execução.");
        alert('Processo finalizado. Verifique a lista!');
      } catch (e: any) {
        console.error("[Admin] Erro capturado no AdminPanel:", e);
        alert(`Falha: ${e.message}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Excluir este registro de pedido permanentemente?')) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (e) {
        alert("Erro ao excluir pedido.");
      }
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[#A61919]">Painel Matelli</h2>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setView('meals')} 
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${view === 'meals' ? 'bg-[#A61919] text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              Cardápio ({meals.length})
            </button>
            <button 
              onClick={() => setView('orders')} 
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${view === 'orders' ? 'bg-[#A61919] text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              Pedidos ({orders.length})
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {view === 'meals' && (
            <>
              {meals.length === 0 && (
                <button 
                  onClick={handleSyncInitial} 
                  disabled={isSyncing}
                  className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold text-[10px] tracking-widest uppercase shadow-xl hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSyncing ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sincronizando...</>
                  ) : (
                    'Sincronizar Inicial'
                  )}
                </button>
              )}
              <button onClick={handleCreate} className="bg-[#009246] text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-[#009246]/20 hover:scale-105 transition-transform text-[10px] tracking-widest uppercase">
                + NOVO PRATO
              </button>
            </>
          )}
          <button onClick={onLogout} className="text-slate-400 hover:text-[#A61919] font-black text-[10px] uppercase tracking-widest px-4">
            SAIR
          </button>
        </div>
      </div>

      {view === 'meals' ? (
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
              {meals.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">O banco está vazio. Use o botão de sincronização acima.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-20">
               <div className="w-10 h-10 border-4 border-[#A61919] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum pedido no Firebase ainda.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.firebaseId} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="bg-[#A61919] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">{order.id}</span>
                    <span className="text-[10px] font-bold text-slate-400">{order.date.toLocaleString()}</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mt-2">Pedido {order.type === 'kit' ? 'de Kit Semanal' : 'Avulso'}</h4>
                  <p className="text-xs text-slate-500 mt-1">{Object.keys(order.shoppingList || {}).length} ingredientes mapeados.</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#A61919]">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <button onClick={() => handleDeleteOrder(order.firebaseId)} className="p-3 text-red-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4H5a2 2 0 0 0-2 2v.041c0 .248.01.493.029.736L4.17 16.924a3 3 0 0 0 2.992 2.73h5.676a3 3 0 0 0 2.992-2.73l1.142-10.147c.018-.243.029-.488.029-.736V6a2 2 0 0 0-2-2h-1v-.25A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75a1.25 1.25 0 0 1 1.25-1.25h2.5a1.25 1.25 0 0 1 1.25 1.25V4h-5v-.25Z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {editingMeal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-2xl w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-bold mb-8 text-[#A61919]">{editingMeal.name ? 'Editar Prato' : 'Novo Prato Matelli'}</h3>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nome da Refeição</label>
                  <input required value={editingMeal.name} onChange={e => setEditingMeal({...editingMeal, name: e.target.value})} className="w-full bg-[#F9F4ED] border-2 border-transparent focus:border-[#A61919] rounded-2xl px-6 py-4 outline-none transition-all font-bold" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Descrição Gourmet</label>
                  <textarea required value={editingMeal.description} onChange={e => setEditingMeal({...editingMeal, description: e.target.value})} className="w-full bg-[#F9F4ED] border-2 border-transparent focus:border-[#A61919] rounded-2xl px-6 py-4 outline-none h-32 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categoria</label>
                  <select value={editingMeal.category} onChange={e => setEditingMeal({...editingMeal, category: e.target.value as MealCategory})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 outline-none font-bold">
                    {Object.values(MealCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preço (R$)</label>
                  <input type="number" step="0.01" required value={editingMeal.price} onChange={e => setEditingMeal({...editingMeal, price: parseFloat(e.target.value)})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Peso (ex: 400g)</label>
                  <input required value={editingMeal.weight} onChange={e => setEditingMeal({...editingMeal, weight: e.target.value})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 outline-none font-bold" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Imagem do Prato (URL)</label>
                  <input value={editingMeal.image} onChange={e => setEditingMeal({...editingMeal, image: e.target.value})} className="w-full bg-[#F9F4ED] rounded-2xl px-6 py-4 outline-none font-mono text-xs" />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-grow bg-[#A61919] text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-[#A61919]/20">SALVAR NO FIREBASE</button>
                <button type="button" onClick={() => setEditingMeal(null)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold uppercase text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
