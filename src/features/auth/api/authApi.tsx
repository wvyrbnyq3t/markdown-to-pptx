import { auth } from "../../../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Googleでサインイン
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  if (!user) {
    throw new Error("ユーザー情報が取得できませんでした。");
  }

  localStorage.setItem(
    "user",
    JSON.stringify({
      userId: user.uid,
      userName: user.displayName || "",
      signInMethod: "google",
    }),
  );

  return user;
};

// ログアウトの処理
const signOut = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem("user");
  } catch (err) {
    throw err;
  }
};

export { signInWithGoogle, signOut };
