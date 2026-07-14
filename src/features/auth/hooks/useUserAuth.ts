import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

export const useUserAuth = () => {
  const [authUser, isAuthLoading, authError] = useAuthState(auth);

  return {
    authUser,
    isAuthLoading,
    authError,
    isSignIn: authUser !== null && authUser !== undefined,
  };
};
