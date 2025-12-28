
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';
import { Meal } from '../types';

const MEALS_COLLECTION = 'meals_data';

export const subscribeToMeals = (callback: (meals: Meal[]) => void) => {
  try {
    console.log("[Firestore] Iniciando monitoramento do cardápio...");
    const q = query(collection(db, MEALS_COLLECTION), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const meals = snapshot.docs.map(doc => ({ ...doc.data() } as Meal));
      console.log(`[Firestore] Sync: ${meals.length} pratos sincronizados do banco.`);
      callback(meals);
    }, (error) => {
      console.error("[Firestore] Erro na escuta em tempo real:", error);
    });
  } catch (error) {
    console.error("[Firestore] Falha crítica ao conectar:", error);
    return () => {};
  }
};

export const saveMealToFirebase = async (meal: Meal) => {
  try {
    console.log(`[Firestore] Preparando gravação de: ${meal.name}`);
    const cleanMeal = JSON.parse(JSON.stringify(meal));
    
    // Timer de 10s para não deixar o processo "pendurado" se houver falha de rede ou regra de segurança
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout ao salvar ${meal.name}. Verifique as regras de segurança do Firestore.`)), 10000)
    );

    const saveOperation = setDoc(doc(db, MEALS_COLLECTION, meal.id), cleanMeal);
    await Promise.race([saveOperation, timeout]);
    
    console.log(`[Firestore] OK: ${meal.name} gravado com sucesso.`);
  } catch (err: any) {
    console.error(`[Firestore] Falha ao salvar prato ${meal.name}:`, err);
    throw err;
  }
};

export const deleteMealFromFirebase = async (mealId: string) => {
  console.log(`[Firestore] Removendo prato do banco: ${mealId}`);
  await deleteDoc(doc(db, MEALS_COLLECTION, mealId));
};

export const syncInitialMenu = async (initialMeals: Meal[]) => {
  if (!initialMeals || initialMeals.length === 0) {
    console.error("[Sync] Erro: Dados iniciais não encontrados.");
    return;
  }

  console.log(`[Sync] Iniciando batch de ${initialMeals.length} itens.`);
  
  for (const [index, meal] of initialMeals.entries()) {
    try {
      console.log(`[Sync] Gravando item ${index + 1}/${initialMeals.length}...`);
      await saveMealToFirebase(meal);
    } catch (e: any) {
      console.error(`[Sync] Erro no item ${meal.id}:`, e.message);
      // Se o primeiro falhar, provavelmente é erro de permissão total no banco
      if (index === 0) throw new Error("A conexão com o Firestore falhou. Verifique se as regras (Rules) permitem escrita.");
    }
  }
  
  console.log("[Sync] Sincronização inicial concluída com êxito.");
};
