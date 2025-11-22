import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredCredentials,
  storeCredentials,
  clearCredentials,
  getAuthHeader,
  isAuthenticated,
} from "@/lib/auth";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("Auth module", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("storeCredentials", () => {
    it("stores credentials in localStorage", () => {
      storeCredentials({ username: "testuser", password: "testpass" });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "contacts_auth",
        JSON.stringify({ username: "testuser", password: "testpass" })
      );
    });
  });

  describe("getStoredCredentials", () => {
    it("returns null when no credentials stored", () => {
      expect(getStoredCredentials()).toBeNull();
    });

    it("returns credentials when stored", () => {
      storeCredentials({ username: "testuser", password: "testpass" });
      const creds = getStoredCredentials();
      expect(creds).toEqual({ username: "testuser", password: "testpass" });
    });

    it("returns null for invalid JSON", () => {
      localStorageMock.getItem.mockReturnValueOnce("invalid json");
      expect(getStoredCredentials()).toBeNull();
    });
  });

  describe("clearCredentials", () => {
    it("removes credentials from localStorage", () => {
      storeCredentials({ username: "testuser", password: "testpass" });
      clearCredentials();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("contacts_auth");
    });
  });

  describe("getAuthHeader", () => {
    it("returns null when not authenticated", () => {
      expect(getAuthHeader()).toBeNull();
    });

    it("returns Basic auth header when authenticated", () => {
      storeCredentials({ username: "testuser", password: "testpass" });
      const header = getAuthHeader();
      expect(header).toBe("Basic dGVzdHVzZXI6dGVzdHBhc3M=");
    });

    it("encodes credentials correctly", () => {
      storeCredentials({ username: "user", password: "pass" });
      const header = getAuthHeader();
      // Decode and verify
      const encoded = header!.replace("Basic ", "");
      const decoded = atob(encoded);
      expect(decoded).toBe("user:pass");
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when not authenticated", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true when credentials are stored", () => {
      storeCredentials({ username: "testuser", password: "testpass" });
      expect(isAuthenticated()).toBe(true);
    });

    it("returns false after clearing credentials", () => {
      storeCredentials({ username: "testuser", password: "testpass" });
      clearCredentials();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
