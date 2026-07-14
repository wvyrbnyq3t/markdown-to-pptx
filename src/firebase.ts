import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBi4PAwoN2An4PCmJp-7SuXWYiJxnI8cZk",
  authDomain: "markdown2pptx.firebaseapp.com",
  projectId: "markdown2pptx",
  storageBucket: "markdown2pptx.firebasestorage.app",
  messagingSenderId: "1086162510345",
  appId: "1:1086162510345:web:ada776442370f844804ed8",
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: ReturnType<typeof getAuth> = getAuth(app);
const db: ReturnType<typeof getFirestore> = getFirestore(app);

export { auth, db };
