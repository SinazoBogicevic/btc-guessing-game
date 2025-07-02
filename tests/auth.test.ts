/**
 * @jest-environment jsdom
 */
import { act, renderHook, RenderHookResult } from "@testing-library/react";
import * as AmplifyAuth from "aws-amplify/auth";
import { useAuth } from "../src/app/hooks/Auth";

jest.mock("aws-amplify/auth");

const mockUser = { username: "testuser" };

let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  it("should set user and loading=false on successful getCurrentUser", async () => {
    (AmplifyAuth.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    let result: RenderHookResult<ReturnType<typeof useAuth>, unknown>;
    await act(async () => {
      result = renderHook(() => useAuth());
    });
    expect(result!.result.current.user).toEqual(mockUser);
    expect(result!.result.current.loading).toBe(false);
  });

  it("should set user=null and loading=false on failed getCurrentUser", async () => {
    (AmplifyAuth.getCurrentUser as jest.Mock).mockRejectedValue(
      new Error("No user")
    );
    (AmplifyAuth.signOut as jest.Mock).mockResolvedValue(undefined);
    let result: RenderHookResult<ReturnType<typeof useAuth>, unknown>;
    await act(async () => {
      result = renderHook(() => useAuth());
    });
    expect(result!.result.current.user).toBe(null);
    expect(result!.result.current.loading).toBe(false);
    expect(AmplifyAuth.signOut).toHaveBeenCalled();
  });

  it("should return success on successful signUp", async () => {
    (AmplifyAuth.signUp as jest.Mock).mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    const res = await result.current.handleSignUp(
      "test@example.com",
      "password"
    );
    expect(res.success).toBe(true);
  });

  it("should return error on failed signUp", async () => {
    (AmplifyAuth.signUp as jest.Mock).mockRejectedValue("error");
    const { result } = renderHook(() => useAuth());
    const res = await result.current.handleSignUp(
      "test@example.com",
      "password"
    );
    expect(res.success).toBe(false);
    expect(res.error).toBe("error");
  });

  it("should return success on successful signIn", async () => {
    (AmplifyAuth.signIn as jest.Mock).mockResolvedValue({});
    (AmplifyAuth.getCurrentUser as jest.Mock).mockResolvedValue({
      username: "testuser",
    });
    const { result } = renderHook(() => useAuth());
    const res = await result.current.handleSignIn(
      "test@example.com",
      "password"
    );
    expect(res.success).toBe(true);
  });

  it("should return error on failed signIn", async () => {
    (AmplifyAuth.signIn as jest.Mock).mockRejectedValue("error");
    const { result } = renderHook(() => useAuth());
    const res = await result.current.handleSignIn(
      "test@example.com",
      "password"
    );
    expect(res.success).toBe(false);
    expect(res.error).toBe("error");
  });

  it("should return success on successful confirmSignUp", async () => {
    (AmplifyAuth.confirmSignUp as jest.Mock).mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    const res = await result.current.handleConfirmSignUp(
      "test@example.com",
      "123456"
    );
    expect(res.success).toBe(true);
  });

  it("should return error on failed confirmSignUp", async () => {
    (AmplifyAuth.confirmSignUp as jest.Mock).mockRejectedValue("error");
    const { result } = renderHook(() => useAuth());
    const res = await result.current.handleConfirmSignUp(
      "test@example.com",
      "123456"
    );
    expect(res.success).toBe(false);
    expect(res.error).toBe("error");
  });

  it("should call signOut on handleSignOut", async () => {
    (AmplifyAuth.signOut as jest.Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleSignOut();
    });
    expect(AmplifyAuth.signOut).toHaveBeenCalled();
  });

  it("should log error on failed signOut", async () => {
    const error = new Error("signout error");
    (AmplifyAuth.signOut as jest.Mock).mockRejectedValue(error);
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleSignOut();
    });
    expect(console.error).toHaveBeenCalled();
  });
});
