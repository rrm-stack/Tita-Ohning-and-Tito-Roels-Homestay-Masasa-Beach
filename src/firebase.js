import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyABCu-q47fz-FMh1p5mBIF0aBaGHQG-7Tw",
  authDomain: "masasa-beach-homestay.firebaseapp.com",
  projectId: "masasa-beach-homestay",
  storageBucket: "masasa-beach-homestay.firebasestorage.app",
  messagingSenderId: "303240946136",
  appId: "1:303240946136:web:3c54020785bbf54cb352ad"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
