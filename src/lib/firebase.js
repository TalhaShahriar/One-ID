import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4sfNXceWIK06M5zjY6QCdDigpsC6iQ2I",
  authDomain: "oneid-7ba99.firebaseapp.com",
  projectId: "oneid-7ba99",
  storageBucket: "oneid-7ba99.firebasestorage.app",
  messagingSenderId: "89032671266",
  appId: "1:89032671266:web:c914bd546cbb672a3bca7b"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
