import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE_THE_EXACT_API_KEY_FROM_FIREBASE",
  authDomain: "masasa-beach-homestay.firebaseapp.com",
  projectId: "masasa-beach-homestay",
  storageBucket: "masasa-beach-homestay.firebasestorage.app",
  messagingSenderId: "303240946136",
  appId: "1:303240946136:web:3c54020785bbf54cb352ad"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
