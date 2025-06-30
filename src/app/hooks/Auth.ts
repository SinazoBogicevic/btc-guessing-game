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

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUser(user);
      })
      .catch(() => {
        setUser(null);
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
    handleSignUp,
    handleSignIn,
    handleConfirmSignUp,
    handleSignOut,
  };
}
