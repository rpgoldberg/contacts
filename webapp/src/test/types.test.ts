import { describe, it, expect } from "vitest";
import { RELATION_LABELS, COMM_TYPE_LABELS, ADDRESS_TYPE_LABELS } from "@/types";

describe("Type constants", () => {
  describe("RELATION_LABELS", () => {
    it("has all expected relation types", () => {
      expect(RELATION_LABELS).toHaveProperty("FAM", "Family");
      expect(RELATION_LABELS).toHaveProperty("FRD", "Friend");
      expect(RELATION_LABELS).toHaveProperty("ASC", "Associate");
      expect(RELATION_LABELS).toHaveProperty("BUS", "Business");
    });
  });

  describe("COMM_TYPE_LABELS", () => {
    it("has all expected communication types", () => {
      expect(COMM_TYPE_LABELS).toHaveProperty("H", "Home");
      expect(COMM_TYPE_LABELS).toHaveProperty("W", "Work");
      expect(COMM_TYPE_LABELS).toHaveProperty("C", "Cell");
      expect(COMM_TYPE_LABELS).toHaveProperty("E", "Email");
      expect(COMM_TYPE_LABELS).toHaveProperty("F", "Fax");
    });
  });

  describe("ADDRESS_TYPE_LABELS", () => {
    it("has all expected address types", () => {
      expect(ADDRESS_TYPE_LABELS).toHaveProperty("H", "Home");
      expect(ADDRESS_TYPE_LABELS).toHaveProperty("W", "Work");
      expect(ADDRESS_TYPE_LABELS).toHaveProperty("O", "Other");
    });
  });
});
