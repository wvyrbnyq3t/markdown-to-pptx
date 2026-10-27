import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export const useUserAuth = () => {
  const [authUser, isAuthLoading, authError] = useAuthState(auth);

  return {
    authUser,
    isAuthLoading,
    authError,
    isSignIn: authUser !== null && authUser !== undefined,
  };
};
