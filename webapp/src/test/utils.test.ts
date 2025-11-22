import { describe, it, expect } from "vitest";
import { formatDate, formatDateShort, calculateAge, calculateYears, cn } from "@/lib/utils";

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

describe("formatDateShort edge cases", () => {
  it("returns original string for invalid date", () => {
    expect(formatDateShort("not-a-date")).toBe("not-a-date");
  });
});

describe("calculateYears", () => {
  it("returns null for null input", () => {
    expect(calculateYears(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(calculateYears(undefined)).toBeNull();
  });

  it("returns null for placeholder years (5000)", () => {
    expect(calculateYears("5000-05-15")).toBeNull();
  });

  it("calculates years for valid date", () => {
    const years = calculateYears("2000-01-01");
    expect(years).toBeGreaterThan(20);
    expect(years).toBeLessThan(30);
  });

  it("returns NaN for invalid date string", () => {
    expect(calculateYears("invalid")).toBeNaN();
  });
});
