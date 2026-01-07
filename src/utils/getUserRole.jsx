import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const getUserRole = async (uid) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data().tipo;
  }

  return null;
};
