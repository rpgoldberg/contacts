import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLogout } from "@/components/AuthProvider";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/",
}));

// Mock auth
const mockClearCredentials = vi.fn();
vi.mock("@/lib/auth", () => ({
  isAuthenticated: () => true,
  clearCredentials: () => mockClearCredentials(),
}));

describe("AuthProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockPush.mockClear();
    mockClearCredentials.mockClear();
  });

  describe("useLogout", () => {
    it("clears credentials on logout", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useLogout(), { wrapper });

      act(() => {
        result.current();
      });

      expect(mockClearCredentials).toHaveBeenCalled();
    });

    it("redirects to login page on logout", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useLogout(), { wrapper });

      act(() => {
        result.current();
      });

      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("clears React Query cache on logout to prevent data leaking between users", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Pre-populate cache with user data
      queryClient.setQueryData(["persons"], { items: [{ id: 1, name: "Test" }], total: 1 });
      queryClient.setQueryData(["person", 1], { id: 1, name: "Test" });
      queryClient.setQueryData(["upcoming"], [{ id: 1, type: "birthday" }]);

      // Verify cache has data
      expect(queryClient.getQueryData(["persons"])).toBeDefined();
      expect(queryClient.getQueryData(["person", 1])).toBeDefined();
      expect(queryClient.getQueryData(["upcoming"])).toBeDefined();

      const { result } = renderHook(() => useLogout(), { wrapper });

      act(() => {
        result.current();
      });

      // Cache should be completely cleared
      expect(queryClient.getQueryData(["persons"])).toBeUndefined();
      expect(queryClient.getQueryData(["person", 1])).toBeUndefined();
      expect(queryClient.getQueryData(["upcoming"])).toBeUndefined();
    });

    it("clears all query cache keys, not just specific ones", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Add various cache entries
      queryClient.setQueryData(["persons", "search", "john"], { items: [], total: 0 });
      queryClient.setQueryData(["persons", "relation", "FAM"], { items: [], total: 0 });
      queryClient.setQueryData(["auth", "me"], { username: "testuser" });

      const { result } = renderHook(() => useLogout(), { wrapper });

      act(() => {
        result.current();
      });

      // All cache should be cleared
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });
});
