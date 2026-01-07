import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeVeAR41_ehhzzJNoOydo4U-GWJo5JPhY",
  authDomain: "reciclaje-mvp.firebaseapp.com",
  projectId: "reciclaje-mvp",
  storageBucket: "reciclaje-mvp.firebasestorage.app",
  messagingSenderId: "1063513276796",
  appId: "1:1063513276796:web:a50aa1dfe294a4345ba4f9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);