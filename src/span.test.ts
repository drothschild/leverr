import { describe, it, expect } from "vitest";
import { Span, formatSpan } from "./span";

describe("Span", () => {
  it("creates a span with line, column, and offset", () => {
    const span: Span = { start: { line: 1, col: 5, offset: 4 }, end: { line: 1, col: 10, offset: 9 } };
    expect(span.start.line).toBe(1);
    expect(span.start.col).toBe(5);
    expect(span.end.col).toBe(10);
  });

  it("formats a span for error messages", () => {
    const span: Span = { start: { line: 3, col: 12, offset: 40 }, end: { line: 3, col: 17, offset: 45 } };
    expect(formatSpan(span)).toBe("line 3, col 12");
  });
});
