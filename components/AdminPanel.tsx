
import React, { useState, useEffect, useMemo } from 'react';
import { Meal, MealCategory } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { saveMealToFirebase, deleteMealFromFirebase, syncInitialMenu } from '../services/mealService';
import { MEALS_DATA } from '../constants';

interface AdminPanelProps {
  meals: Meal[];
  onLogout: () => void;
}

type ViewType = 'meals' | 'orders' | 'shopping';

const STATUS_COLORS: Record<string, string> = {
  aprovado: 'bg-emerald-100 text-emerald-700',
  compras: 'bg-amber-100 text-amber-700',
  produzindo: 'bg-blue-100 text-blue-700',
  entregues: 'bg-slate-100 text-slate-700',
};

const AdminPanel: React.FC<AdminPanelProps> = ({ meals, onLogout }) => {
  const [editingMeal, setEditingMeal] = useState<Partial<Meal> | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [view, setView] = useState<ViewType>('meals');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
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
  }, []);

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
    if (window.confirm('Deseja popular o banco de dados com os pratos iniciais?')) {
      setIsSyncing(true);
      try {
        await syncInitialMenu(MEALS_DATA);
        alert('Processo finalizado. Verifique a lista!');
      } catch (e: any) {
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

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (e) {
      alert("Erro ao atualizar status.");
    }
  };

  // Consolidação da Lista de Compras
  const shoppingData = useMemo(() => {
    // Pegamos pedidos que precisam de compras (status aprovado ou compras)
    const activeOrders = orders.filter(o => o.status === 'aprovado' || o.status === 'compras');
    const consolidated: Record<string, { measures: string[], orderIds: string[] }> = {};

    activeOrders.forEach(order => {
      const list = order.shoppingList || {};
      Object.entries(list).forEach(([ingredient, measures]) => {
        if (!consolidated[ingredient]) {
          consolidated[ingredient] = { measures: [], orderIds: [] };
        }
        consolidated[ingredient].measures.push(...(measures as string[]));
        if (!consolidated[ingredient].orderIds.includes(order.id)) {
          consolidated[ingredient].orderIds.push(order.id);
        }
      });
    });

    return {
      items: consolidated,
      orderIds: activeOrders.map(o => o.id),
      firebaseIds: activeOrders.map(o => o.firebaseId)
    };
  }, [orders]);

  const handleSendShoppingToWhatsapp = () => {
    if (Object.keys(shoppingData.items).length === 0) return;

    let text = `*🛒 LISTA CONSOLIDADA DE COMPRAS - MATELLI*\n`;
    text += `*Pedidos:* ${shoppingData.orderIds.join(', ')}\n\n`;

    Object.entries(shoppingData.items).forEach(([name, data]) => {
      text += `• *${name}*: ${data.measures.join(' + ')}\n`;
    });

    window.open(`https://wa.me/559184503875?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleMarkAsPurchased = async () => {
    if (shoppingData.firebaseIds.length === 0) return;
    if (!window.confirm(`Deseja marcar as compras de ${shoppingData.orderIds.length} pedidos como realizadas? Eles mudarão para o status 'produzindo'.`)) return;

    setIsUpdatingStatus(true);
    try {
      const batch = writeBatch(db);
      shoppingData.firebaseIds.forEach(fid => {
        batch.update(doc(db, "orders", fid), { status: 'produzindo' });
      });
      await batch.commit();
      alert("Status atualizado para 'Produzindo' com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar status em massa.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[#A61919]">Painel Matelli</h2>
          <div className="flex flex-wrap gap-4 mt-4">
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
            <button 
              onClick={() => setView('shopping')} 
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${view === 'shopping' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
            >
              🛒 Lista de Compras
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
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Inicial'}
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
            </tbody>
          </table>
        </div>
      ) : view === 'orders' ? (
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
                  <div className="flex gap-2 mt-2">
                    <select 
                      value={order.status || 'aprovado'} 
                      onChange={(e) => handleUpdateOrderStatus(order.firebaseId, e.target.value)}
                      className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                    >
                      {['feito', 'aprovado', 'compras', 'esperando', 'produzindo', 'entregues', 'avaliados'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#A61919]">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <button onClick={() => handleDeleteOrder(order.firebaseId)} className="p-3 text-red-200 hover:text-red-600 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4H5a2 2 0 0 0-2 2v.041c0 .248.01.493.029.736L4.17 16.924a3 3 0 0 0 2.992 2.73h5.676a3 3 0 0 0 2.992-2.73l1.142-10.147c.018-.243.029-.488.029-.736V6a2 2 0 0 0-2-2h-1v-.25A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75a1.25 1.25 0 0 1 1.25-1.25h2.5a1.25 1.25 0 0 1 1.25 1.25V4h-5v-.25Z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="bg-emerald-50 rounded-3xl p-8 mb-8 border border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold text-emerald-800">Consolidado de Compras</h3>
              <p className="text-emerald-600 text-sm font-medium">Agregando ingredientes de {shoppingData.orderIds.length} pedidos pendentes.</p>
              <div className="flex gap-2 mt-3">
                {shoppingData.orderIds.map(id => (
                  <span key={id} className="text-[9px] font-black bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{id}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSendShoppingToWhatsapp}
                className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200 flex items-center gap-2 hover:bg-emerald-700 transition-all"
              >
                📲 Enviar WhatsApp
              </button>
              <button 
                onClick={handleMarkAsPurchased}
                disabled={isUpdatingStatus || shoppingData.firebaseIds.length === 0}
                className="bg-amber-500 text-white px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-amber-200 flex items-center gap-2 hover:bg-amber-600 transition-all disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Processando...' : '✅ Compra Realizada'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(shoppingData.items).map(([name, data]) => (
              <div key={name} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-lg">{name}</h4>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                    {data.orderIds.length} Pedidos
                  </span>
                </div>
                <div className="space-y-1">
                  {data.measures.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      {m}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50">
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Origens:</p>
                   <p className="text-[9px] font-bold text-slate-400">{data.orderIds.join(', ')}</p>
                </div>
              </div>
            ))}
            {Object.keys(shoppingData.items).length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Não há pedidos nos status 'aprovado' ou 'compras'.</p>
              </div>
            )}
          </div>
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
