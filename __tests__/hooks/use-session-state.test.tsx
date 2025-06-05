import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { useSessionState } from "@/hooks/use-session-state";
import { SessionManager } from "@/lib/auth/utils/session-manager";
import { ErrorManager } from "@/lib/error-handling/error-manager";
import { act, renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";

jest.mock("next-auth/react", () => ({ useSession: jest.fn() }));
jest.mock("@/hooks/use-redux");
jest.mock("@/lib/auth/session-manager", () => ({
  SessionManager: { refreshIfNeeded: jest.fn() },
}));

const dispatch = jest.fn();
(useAppDispatch as jest.Mock).mockReturnValue(dispatch);
(useAppSelector as jest.Mock).mockImplementation((sel) =>
  sel({ app: { domain: null, tenantId: null } })
);

describe("useSessionState", () => {
  it("returns auth flags", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { hasGoogleAuth: true },
      status: "authenticated",
      update: jest.fn(),
    });
    const { result } = renderHook(() => useSessionState());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasGoogleAuth).toBe(true);
  });

  it("dispatches logout on refresh failure", async () => {
    jest.useFakeTimers();
    const update = jest.fn();
    (useSession as jest.Mock).mockReturnValue({
      data: {},
      status: "authenticated",
      update,
    });
    (SessionManager.refreshIfNeeded as jest.Mock).mockResolvedValue(false);
    const spy = jest
      .spyOn(ErrorManager, "dispatch")
      .mockImplementation(() => {});
    renderHook(() => useSessionState());
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
    });
    renderHook(() => useSessionState());
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
      jest.runOnlyPendingTimers();
    });
    expect(spy).toHaveBeenCalled();
    jest.useRealTimers();
    jest.useRealTimers();
  });
});
