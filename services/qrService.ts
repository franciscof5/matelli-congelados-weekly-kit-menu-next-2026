import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc
} from 'firebase/firestore';

/* =========================
   TIPOS
========================= */

export interface QRVisit {
  timestamp: any;
  userAgent: string;
  language: string;
}

export interface QRCodeData {
  id: string;
  name: string;
  totalAccesses: number;
  createdAt: any;
  lastVisit?: any;
}

/* =========================
   CONSTANTES
========================= */

const QR_COLLECTION = 'qrcodes';

/* =========================
   REGISTRAR VISITA (SCAN)
   - Cria QR se não existir
   - Incrementa contador
   - Salva visita em subcoleção
========================= */

export const logQRVisit = async (
  id: string,
  outlink: string,
  name?: string
): Promise<boolean> => {
  try {
    const qrRef = doc(db, QR_COLLECTION, id);
    const qrSnap = await getDoc(qrRef);

    if (!qrSnap.exists()) {
      // Primeiro acesso → cria QR
      await setDoc(qrRef, {
        id,
        name: name || `QR ${id}`,
        totalAccesses: 1,
        createdAt: serverTimestamp(),
        lastVisit: serverTimestamp()
      });
    } else {
      // QR existente → incrementa
      await updateDoc(qrRef, {
        totalAccesses: increment(1),
        lastVisit: serverTimestamp()
      });
    }

    // 🔥 AQUI está o ponto-chave
    await addDoc(collection(qrRef, 'visits'), {
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      outlink // 👈 salva o link de saída usado
    });

    return true;
  } catch (error) {
    console.error('Erro ao registrar visita QR:', error);
    return false;
  }
};


/* =========================
   CRIAR QR MANUALMENTE (ADMIN)
========================= */

export const createQRCodeTracker = async (
  id: string,
  name: string
): Promise<void> => {
  const qrRef = doc(db, QR_COLLECTION, id);

  await setDoc(qrRef, {
    id,
    name,
    totalAccesses: 0,
    createdAt: serverTimestamp()
  });
};

/* =========================
   LISTAR QRS (ADMIN)
========================= */

export const subscribeToQRCodes = (
  callback: (qrs: QRCodeData[]) => void
) => {
  const q = query(
    collection(db, QR_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const qrs: QRCodeData[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as QRCodeData)
    }));

    callback(qrs);
  });
};

/* =========================
   REMOVER QR (ADMIN - opcional)
========================= */

export const deleteQRCode = async (id: string): Promise<void> => {
  const qrRef = doc(db, QR_COLLECTION, id);
  await deleteDoc(qrRef);
};
