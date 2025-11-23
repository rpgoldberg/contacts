import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  getUpcomingBirthdays,
} from "@/lib/api";

// Mock auth
const mockHandleSessionExpired = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthHeader: () => "Basic dGVzdDp0ZXN0",
  handleSessionExpired: () => mockHandleSessionExpired(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API module", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("getPersons", () => {
    it("fetches persons list with paginated response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [{ id: 1, display_name: "Test" }], total: 1 }),
      });

      const result = await getPersons();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith("/api/persons/", expect.any(Object));
    });

    it("includes search params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      await getPersons({ search: "john" });
      expect(mockFetch).toHaveBeenCalledWith("/api/persons/?search=john", expect.any(Object));
    });

    it("includes relation filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      await getPersons({ relation: "FAM" });
      expect(mockFetch).toHaveBeenCalledWith("/api/persons/?relation=FAM", expect.any(Object));
    });

    it("includes pagination params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 100 }),
      });

      await getPersons({ skip: 50, limit: 25 });
      expect(mockFetch).toHaveBeenCalledWith("/api/persons/?skip=50&limit=25", expect.any(Object));
    });

    it("includes sort and dr_filter params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 5 }),
      });

      await getPersons({ sort_by: "first", dr_filter: true });
      expect(mockFetch).toHaveBeenCalledWith("/api/persons/?dr_filter=true&sort_by=first", expect.any(Object));
    });
  });

  describe("getPerson", () => {
    it("fetches single person by id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, first_name: "John" }),
      });

      const result = await getPerson(1);
      expect(result.first_name).toBe("John");
      expect(mockFetch).toHaveBeenCalledWith("/api/persons/1", expect.any(Object));
    });
  });

  describe("createPerson", () => {
    it("posts new person data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, first_name: "Jane" }),
      });

      const result = await createPerson({ first_name: "Jane" });
      expect(result.id).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/persons/",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("updatePerson", () => {
    it("puts updated person data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, first_name: "Updated" }),
      });

      await updatePerson(1, { first_name: "Updated" });
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/persons/1",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  describe("deletePerson", () => {
    it("deletes person", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await deletePerson(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/persons/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("error handling", () => {
    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(getPerson(999)).rejects.toThrow("API Error: 404 Not Found");
    });

    it("handles 401 by triggering session expiry handler", async () => {
      mockHandleSessionExpired.mockClear();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(getPersons()).rejects.toThrow("Session expired");

      // Should call handleSessionExpired which clears credentials and redirects
      expect(mockHandleSessionExpired).toHaveBeenCalled();
    });
  });

  describe("auth header", () => {
    it("includes authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getPersons();
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.Authorization).toBe("Basic dGVzdDp0ZXN0");
    });
  });

  describe("upcoming events", () => {
    it("fetches birthdays with default days", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getUpcomingBirthdays();
      expect(mockFetch).toHaveBeenCalledWith("/api/upcoming/birthdays?days=30", expect.any(Object));
    });

    it("fetches birthdays with custom days", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getUpcomingBirthdays(60);
      expect(mockFetch).toHaveBeenCalledWith("/api/upcoming/birthdays?days=60", expect.any(Object));
    });
  });
});

// Additional API function tests
import {
  createAddress,
  updateAddress,
  deleteAddress,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getLookupCodes,
  getUpcomingAnniversaries,
  getUpcomingAll,
} from "@/lib/api";

describe("Address API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("creates address", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, address1: "123 Main St" }),
    });

    const result = await createAddress({ address1: "123 Main St" });
    expect(result.address1).toBe("123 Main St");
    expect(mockFetch).toHaveBeenCalledWith("/api/addresses/", expect.objectContaining({ method: "POST" }));
  });

  it("updates address", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, address1: "456 Oak Ave" }),
    });

    await updateAddress(1, { address1: "456 Oak Ave" });
    expect(mockFetch).toHaveBeenCalledWith("/api/addresses/1", expect.objectContaining({ method: "PUT" }));
  });

  it("deletes address", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

    await deleteAddress(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/addresses/1", expect.objectContaining({ method: "DELETE" }));
  });
});

describe("Communication API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("creates communication", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, detail: "555-1234" }),
    });

    const result = await createCommunication({ detail: "555-1234" });
    expect(result.detail).toBe("555-1234");
  });

  it("updates communication", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, detail: "555-5678" }),
    });

    await updateCommunication(1, { detail: "555-5678" });
    expect(mockFetch).toHaveBeenCalledWith("/api/communications/1", expect.objectContaining({ method: "PUT" }));
  });

  it("deletes communication", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

    await deleteCommunication(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/communications/1", expect.objectContaining({ method: "DELETE" }));
  });
});

describe("Attribute API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("creates attribute", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, value: "Likes golf" }),
    });

    const result = await createAttribute({ value: "Likes golf" });
    expect(result.value).toBe("Likes golf");
  });

  it("updates attribute", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, value: "Loves golf" }),
    });

    await updateAttribute(1, { value: "Loves golf" });
    expect(mockFetch).toHaveBeenCalledWith("/api/attributes/1", expect.objectContaining({ method: "PUT" }));
  });

  it("deletes attribute", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

    await deleteAttribute(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/attributes/1", expect.objectContaining({ method: "DELETE" }));
  });
});

describe("Lookup Codes API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("fetches all lookup codes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, code: "FAM" }]),
    });

    await getLookupCodes();
    expect(mockFetch).toHaveBeenCalledWith("/api/lookup-codes/", expect.any(Object));
  });

  it("fetches lookup codes by field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getLookupCodes("relation");
    expect(mockFetch).toHaveBeenCalledWith("/api/lookup-codes/?field_name=relation", expect.any(Object));
  });
});

describe("More Upcoming Events", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("fetches anniversaries", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getUpcomingAnniversaries(45);
    expect(mockFetch).toHaveBeenCalledWith("/api/upcoming/anniversaries?days=45", expect.any(Object));
  });

  it("fetches all upcoming events", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getUpcomingAll(90);
    expect(mockFetch).toHaveBeenCalledWith("/api/upcoming/all?days=90", expect.any(Object));
  });
});

import { searchUsers } from "@/lib/api";

describe("User Search API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("searches users by prefix", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, username: "testuser" }]),
    });

    const result = await searchUsers("test");
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("testuser");
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/users?prefix=test", expect.any(Object));
  });

  it("returns empty array for empty prefix", async () => {
    const result = await searchUsers("");
    expect(result).toHaveLength(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("URL encodes special characters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await searchUsers("test@user");
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/users?prefix=test%40user", expect.any(Object));
  });
});
