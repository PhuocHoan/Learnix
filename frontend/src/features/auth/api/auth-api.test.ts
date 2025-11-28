import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./auth-api";

describe("Auth API Schemas", () => {
  describe("loginSchema", () => {
    it("validates correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password123",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("email");
      }
    });

    it("rejects short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "12345", // less than 6 chars
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("6");
      }
    });

    it("rejects empty email", () => {
      const invalidData = {
        email: "",
        password: "password123",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects missing fields", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("validates correct registration data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
        fullName: "John Doe",
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("allows registration without fullName (optional)", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects short fullName", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        fullName: "J", // less than 2 chars
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("2");
      }
    });

    it("rejects invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
        fullName: "John Doe",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "123", // less than 6 chars
        fullName: "John Doe",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
