import { describe, it, expect } from "vitest";
import { formatDate, formatDateShort, calculateAge, cn } from "@/lib/utils";

describe("formatDate", () => {
  it("formats a valid date string", () => {
    expect(formatDate("1990-05-15")).toBe("May 15, 1990");
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });
});

describe("formatDateShort", () => {
  it("formats a date to short format", () => {
    expect(formatDateShort("1990-05-15")).toBe("May 15");
  });

  it("returns empty string for null", () => {
    expect(formatDateShort(null)).toBe("");
  });
});

describe("calculateAge", () => {
  it("returns null for null input", () => {
    expect(calculateAge(null)).toBeNull();
  });

  it("returns null for placeholder years (5000)", () => {
    expect(calculateAge("5000-05-15")).toBeNull();
  });

  it("calculates age for valid date", () => {
    const age = calculateAge("1990-01-01");
    expect(age).toBeGreaterThan(30);
    expect(age).toBeLessThan(50);
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
