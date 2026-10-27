import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKF3KGbOYqmHwaxCkBBNI1o68fxKolEJk",
  authDomain: "markdown-to-pptx.firebaseapp.com",
  projectId: "markdown-to-pptx",
  storageBucket: "markdown-to-pptx.firebasestorage.app",
  messagingSenderId: "394989026793",
  appId: "1:394989026793:web:0d98aec12863aae0a2df78",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };