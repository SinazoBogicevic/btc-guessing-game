import { Amplify } from "aws-amplify";
import {
  AuthUser,
  confirmSignUp,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { useEffect, useState } from "react";

Amplify.configure({
  Auth: {
    // @ts-expect-error-next-line
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    },
    region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
  },
});

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUser(user);
        setLoading(false);
      })
      .catch(async () => {
        try {
          await signOut();
        } catch (e) {
          console.error("Error during sign out in initial auth check:", e);
        }
        setUser(null);
        setLoading(false);
      });
  }, []);

  const handleSignUp = async (email: string, password: string) => {
    try {
      await signUp({
        username: email,
        password,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn({
        username: email,
        password,
      });
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const handleConfirmSignUp = async (email: string, code: string) => {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return {
    user,
    loading,
    handleSignUp,
    handleSignIn,
    handleConfirmSignUp,
    handleSignOut,
  };
}
