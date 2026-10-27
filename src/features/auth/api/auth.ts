import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Googleアカウントでサインイン
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  if (!user) {
    throw new Error("ユーザー情報が取得できませんでした。");
  }

  return user;
};

// サインアウト
export const signOut = async () => {
  await auth.signOut();
};
