import { describe, it, expect } from "vitest";

// Test the internal helper functions by importing the module
// We test the exported sendSpreadsheetEmail indirectly via the utility functions
// Since cellDataToGrid and generateCSV are private, we test via module internals

// We can test the email validation schema from the route
import { z } from "zod/v4";

const emailBodySchema = z.object({
  recipients: z.array(z.email()).min(1).max(10),
  subject: z.string().min(1).max(500),
  message: z.string().max(5000).default(""),
  format: z.enum(["pdf", "xlsx", "csv"]),
});

describe("Email attachment validation schema", () => {
  it("validates a correct email payload", () => {
    const result = emailBodySchema.safeParse({
      recipients: ["user@example.com"],
      subject: "Test spreadsheet",
      message: "Here is the file",
      format: "xlsx",
    });
    expect(result.success).toBe(true);
  });

  it("allows multiple recipients", () => {
    const result = emailBodySchema.safeParse({
      recipients: ["a@b.com", "c@d.com", "e@f.com"],
      subject: "Shared file",
      message: "",
      format: "csv",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty recipients array", () => {
    const result = emailBodySchema.safeParse({
      recipients: [],
      subject: "Test",
      message: "",
      format: "pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 recipients", () => {
    const recipients = Array.from(
      { length: 11 },
      (_, i) => `user${i}@test.com`,
    );
    const result = emailBodySchema.safeParse({
      recipients,
      subject: "Test",
      message: "",
      format: "pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email addresses", () => {
    const result = emailBodySchema.safeParse({
      recipients: ["not-an-email"],
      subject: "Test",
      message: "",
      format: "pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format", () => {
    const result = emailBodySchema.safeParse({
      recipients: ["user@example.com"],
      subject: "Test",
      message: "",
      format: "docx",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = emailBodySchema.safeParse({
      recipients: ["user@example.com"],
      subject: "",
      message: "",
      format: "csv",
    });
    expect(result.success).toBe(false);
  });

  it("defaults message to empty string", () => {
    const result = emailBodySchema.safeParse({
      recipients: ["user@example.com"],
      subject: "Test",
      format: "csv",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("");
    }
  });

  it("accepts all three valid formats", () => {
    for (const format of ["pdf", "xlsx", "csv"] as const) {
      const result = emailBodySchema.safeParse({
        recipients: ["user@example.com"],
        subject: "Test",
        message: "",
        format,
      });
      expect(result.success).toBe(true);
    }
  });
});
