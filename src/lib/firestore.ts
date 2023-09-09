import firebase from './firebaseClient';

const db = firebase.firestore();

export const addSupplement = async (data:any) => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  await db.collection('supplements').add({
    ...data,
    userId: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const getSupplements = async () => {
  const user = firebase.auth().currentUser;
  if (!user) return [];

  const snapshot = await db
    .collection('supplements')
    .where('userId', '==', user.uid)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateSupplement = async (id: string | undefined, data:any) => {
  await db.collection('supplements').doc(id).update(data);
};

export const deleteSupplement = async (id: string | undefined) => {
  await db.collection('supplements').doc(id).delete();
};
